import prisma from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { emitToUsers, emitToConversation, isOnline } from "../realtime/socket.js";
import { activityService } from "./activity.service.js";
import { sendMail, appUrl } from "./mail.service.js";
import { toFileDto } from "../utils/fileUrl.js";

// Communication Centre: internal real-time messaging between Palmadex staff and customers.
// WhatsApp history imported into CRM stays on the CRM contact page (channel WHATSAPP).

const SUPPORT_DESK_ROLES = ["SUPER_ADMIN", "ADMIN", "CUSTOMER_SUPPORT"];
const userSelect = { id: true, firstName: true, lastName: true, email: true, role: true, customer: { select: { name: true } } };
const fullName = (u) => (u ? `${u.firstName} ${u.lastName}`.trim() : "Former user");

const activityThrottle = new Map(); // `${userId}:${conversationId}` -> timestamp
const emailThrottle = new Map(); // `${userId}:${conversationId}` -> timestamp

const memberDto = (m) => ({
  id: m.user.id, name: fullName(m.user), email: m.user.email, role: m.user.role,
  organization: m.user.customer?.name || null, online: isOnline(m.user.id), lastReadAt: m.lastReadAt,
});

const messageDto = (m, viewerId) => ({
  id: m.id,
  conversationId: m.conversationId,
  content: m.isDeleted ? null : m.content,
  type: m.type,
  isEdited: m.isEdited,
  isDeleted: m.isDeleted,
  sender: m.sender ? { id: m.sender.id, name: fullName(m.sender), role: m.sender.role } : null,
  mine: m.senderId === viewerId,
  attachments: m.isDeleted ? [] : (m.attachments || []).map((a) => toFileDto({ id: a.file.id, originalName: a.file.originalName, mimeType: a.file.mimeType, size: a.file.size }, viewerId)),
  createdAt: m.createdAt,
});

function conversationTitle(c, viewerId) {
  if (c.title) return c.title;
  const others = c.members.filter((m) => m.user.id !== viewerId).map((m) => fullName(m.user));
  if (c.type === "COMPANY") return "Palmadex team";
  return others.join(", ") || "Just you";
}

async function unreadCount(conversationId, member) {
  return prisma.message.count({
    where: {
      conversationId,
      isDeleted: false,
      senderId: { not: member.userId },
      ...(member.lastReadAt ? { createdAt: { gt: member.lastReadAt } } : {}),
    },
  });
}

async function loadConversation(id) {
  return prisma.conversation.findUnique({
    where: { id },
    include: { members: { include: { user: { select: userSelect } }, orderBy: { joinedAt: "asc" } } },
  });
}

function conversationDto(c, viewer, extra = {}) {
  const me = c.members.find((m) => m.user.id === viewer.id);
  return {
    id: c.id, type: c.type, title: conversationTitle(c, viewer.id), customTitle: c.title,
    members: c.members.map(memberDto), lastReadAt: me?.lastReadAt || null,
    createdAt: c.createdAt, updatedAt: c.updatedAt, ...extra,
  };
}

// Who a user may start a conversation with.
async function contactableWhere(user) {
  const base = { companyId: user.companyId, isActive: true, approvalStatus: "APPROVED", id: { not: user.id } };
  if (user.role === "CUSTOMER") return { ...base, role: { not: "CUSTOMER" } };
  return base;
}

async function supportDesk(companyId) {
  return prisma.user.findMany({
    where: { companyId, isActive: true, approvalStatus: "APPROVED", role: { in: SUPPORT_DESK_ROLES } },
    select: { id: true },
  });
}

export const messagingService = {
  async assertMember(user, conversationId) {
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
      include: { conversation: { select: { companyId: true, channel: true } } },
    });
    if (!member || member.conversation.companyId !== user.companyId) throw new HttpError(404, "Conversation not found");
    return member;
  },

  async directory(user, { q }) {
    const where = await contactableWhere(user);
    if (q) where.OR = [{ firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }];
    const users = await prisma.user.findMany({ where, select: userSelect, orderBy: [{ firstName: "asc" }], take: 100 });
    return users.map((u) => ({ id: u.id, name: fullName(u), email: u.email, role: u.role, organization: u.customer?.name || null, online: isOnline(u.id) }));
  },

  async list(user, { q } = {}) {
    const memberships = await prisma.conversationMember.findMany({
      where: { userId: user.id, conversation: { companyId: user.companyId, channel: "INTERNAL" } },
      include: {
        conversation: {
          include: {
            members: { include: { user: { select: userSelect } } },
            messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: userSelect } } },
          },
        },
      },
      orderBy: { conversation: { updatedAt: "desc" } },
      take: 100,
    });

    let items = await Promise.all(memberships.map(async (m) => {
      const c = m.conversation;
      const last = c.messages[0];
      return conversationDto(c, user, {
        unread: await unreadCount(c.id, m),
        lastMessage: last ? {
          content: last.isDeleted ? "Message deleted" : last.content || (last.type === "FILE" ? "Attachment" : ""),
          senderName: fullName(last.sender), mine: last.senderId === user.id, createdAt: last.createdAt,
        } : null,
      });
    }));
    if (q) {
      const needle = q.toLowerCase();
      items = items.filter((c) => c.title.toLowerCase().includes(needle) || c.members.some((m) => m.name.toLowerCase().includes(needle)));
    }
    return items;
  },

  async unreadTotal(user) {
    const memberships = await prisma.conversationMember.findMany({
      where: { userId: user.id, conversation: { companyId: user.companyId, channel: "INTERNAL" } },
    });
    const counts = await Promise.all(memberships.map((m) => unreadCount(m.conversationId, m)));
    return counts.reduce((a, b) => a + b, 0);
  },

  async get(user, id) {
    const member = await this.assertMember(user, id);
    const c = await loadConversation(id);
    return conversationDto(c, user, { unread: await unreadCount(id, member) });
  },

  async create(user, { type, userIds = [], title, message }) {
    const ids = [...new Set(userIds.filter((id) => id !== user.id))];

    if (type === "COMPANY") {
      // An enquiry to the Palmadex team: the support desk joins automatically.
      const desk = await supportDesk(user.companyId);
      ids.push(...desk.map((d) => d.id).filter((id) => id !== user.id && !ids.includes(id)));
      if (!ids.length) throw new HttpError(400, "No Palmadex team members are available yet. Please raise a support ticket.");
    } else {
      if (!ids.length) throw new HttpError(400, "Choose at least one person to message");
      if (type === "DIRECT" && ids.length !== 1) throw new HttpError(400, "A direct conversation is with exactly one person");
      if (type === "GROUP" && user.role === "CUSTOMER") throw new HttpError(403, "Customers can message the Palmadex team or a staff member directly");
    }

    const allowed = await prisma.user.count({ where: { ...(await contactableWhere(user)), id: { in: ids } } });
    if (type !== "COMPANY" && allowed !== ids.length) throw new HttpError(400, "One or more selected people cannot be messaged");

    if (type === "DIRECT") {
      const existing = await prisma.conversation.findFirst({
        where: {
          companyId: user.companyId, channel: "INTERNAL", type: "DIRECT",
          AND: [{ members: { some: { userId: user.id } } }, { members: { some: { userId: ids[0] } } }],
        },
      });
      if (existing) {
        if (message) await this.send(user, existing.id, { content: message });
        return this.get(user, existing.id);
      }
    }

    const c = await prisma.conversation.create({
      data: {
        companyId: user.companyId, channel: "INTERNAL", type,
        title: type === "DIRECT" ? null : title || (type === "COMPANY" ? `Enquiry from ${fullName(user)}` : null),
        members: { create: [user.id, ...ids].map((userId) => ({ userId, ...(userId === user.id ? { lastReadAt: new Date() } : {}) })) },
      },
    });

    activityService.record({
      companyId: user.companyId, userId: user.id, action: "started", entity: "Conversation", entityId: c.id,
      summary: type === "COMPANY" ? "sent an enquiry to the Palmadex team" : "started a conversation",
    });

    if (message) await this.send(user, c.id, { content: message });
    const dto = await this.get(user, c.id);
    emitToUsers(ids, "conversation:new", { id: c.id });
    return dto;
  },

  async rename(user, id, title) {
    await this.assertMember(user, id);
    const c = await prisma.conversation.findUnique({ where: { id } });
    if (c.type === "DIRECT") throw new HttpError(400, "Direct conversations cannot be renamed");
    await prisma.conversation.update({ where: { id }, data: { title } });
    const full = await loadConversation(id);
    emitToUsers(full.members.map((m) => m.userId), "conversation:updated", { id });
    return conversationDto(full, user);
  },

  async addMembers(user, id, userIds) {
    if (user.role === "CUSTOMER") throw new HttpError(403, "Customers cannot add people to conversations");
    await this.assertMember(user, id);
    const c = await loadConversation(id);
    if (c.type === "DIRECT") throw new HttpError(400, "Start a group conversation to include more people");
    const existing = new Set(c.members.map((m) => m.userId));
    const toAdd = [...new Set(userIds)].filter((uid) => !existing.has(uid));
    const valid = await prisma.user.findMany({ where: { ...(await contactableWhere(user)), id: { in: toAdd } }, select: { id: true, firstName: true, lastName: true } });
    if (!valid.length) throw new HttpError(400, "No new people to add");
    await prisma.conversationMember.createMany({ data: valid.map((u) => ({ conversationId: id, userId: u.id })), skipDuplicates: true });
    await this.systemMessage(id, `${fullName(user)} added ${valid.map(fullName).join(", ")}`);
    emitToUsers(valid.map((u) => u.id), "conversation:new", { id });
    return this.get(user, id);
  },

  async leave(user, id) {
    await this.assertMember(user, id);
    const c = await prisma.conversation.findUnique({ where: { id } });
    if (c.type === "DIRECT") throw new HttpError(400, "You cannot leave a direct conversation");
    await prisma.conversationMember.delete({ where: { conversationId_userId: { conversationId: id, userId: user.id } } });
    await this.systemMessage(id, `${fullName(user)} left the conversation`);
  },

  async systemMessage(conversationId, content) {
    const m = await prisma.message.create({
      data: { conversationId, content, type: "SYSTEM", direction: "SYSTEM", senderType: "SYSTEM" },
      include: { sender: { select: userSelect }, attachments: { include: { file: true } } },
    });
    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    const members = await prisma.conversationMember.findMany({ where: { conversationId }, select: { userId: true } });
    emitToUsers(members.map((x) => x.userId), "message:new", messageDto(m, null));
  },

  async messages(user, id, { before, limit = 40 }) {
    await this.assertMember(user, id);
    const rows = await prisma.message.findMany({
      where: { conversationId: id, ...(before ? { createdAt: { lt: new Date(before) } } : {}) },
      include: { sender: { select: userSelect }, attachments: { include: { file: true } } },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100) + 1,
    });
    const hasMore = rows.length > limit;
    return { data: rows.slice(0, limit).reverse().map((m) => messageDto(m, user.id)), meta: { hasMore } };
  },

  async send(user, id, { content, fileIds = [] }) {
    await this.assertMember(user, id);
    const text = (content || "").trim();
    if (!text && !fileIds.length) throw new HttpError(400, "Type a message or attach a file");

    let files = [];
    if (fileIds.length) {
      files = await prisma.file.findMany({ where: { id: { in: fileIds }, companyId: user.companyId, uploadedById: user.id } });
      if (files.length !== fileIds.length) throw new HttpError(400, "One or more attachments were not found");
    }

    const m = await prisma.message.create({
      data: {
        conversationId: id, senderId: user.id, content: text || null,
        type: files.length && !text ? "FILE" : "TEXT", direction: "OUTBOUND", senderType: "USER",
        attachments: { create: files.map((f) => ({ fileId: f.id })) },
      },
      include: { sender: { select: userSelect }, attachments: { include: { file: true } } },
    });
    await prisma.$transaction([
      prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } }),
      prisma.conversationMember.update({ where: { conversationId_userId: { conversationId: id, userId: user.id } }, data: { lastReadAt: new Date() } }),
    ]);

    const conversation = await loadConversation(id);
    const recipients = conversation.members.filter((x) => x.userId !== user.id);

    // Each viewer gets the message with their own signed attachment links.
    for (const r of conversation.members) emitToUsers([r.userId], "message:new", messageDto(m, r.userId));

    // Email people who are offline, at most once every 30 minutes per conversation.
    const now = Date.now();
    for (const r of recipients) {
      const key = `${r.userId}:${id}`;
      if (isOnline(r.userId) || now - (emailThrottle.get(key) || 0) < 30 * 60_000) continue;
      emailThrottle.set(key, now);
      sendMail({
        to: r.user.email,
        subject: `New message from ${fullName(user)}`,
        heading: `${fullName(user)} sent you a message`,
        paragraphs: [text ? (text.length > 300 ? `${text.slice(0, 300)}...` : text) : "They sent you an attachment."],
        action: { label: "Reply in Palmadex 360", url: appUrl(`/communication?c=${id}`) },
      });
    }

    const tKey = `${user.id}:${id}`;
    if (now - (activityThrottle.get(tKey) || 0) > 10 * 60_000) {
      activityThrottle.set(tKey, now);
      activityService.record({
        companyId: user.companyId, userId: user.id, action: "messaged", entity: "Conversation", entityId: id,
        summary: `sent a message in ${conversationDto(conversation, user).title}`,
      });
    }
    return messageDto(m, user.id);
  },

  async edit(user, messageId, content) {
    const m = await prisma.message.findUnique({ where: { id: messageId } });
    if (!m || m.senderId !== user.id || m.isDeleted) throw new HttpError(404, "Message not found");
    await this.assertMember(user, m.conversationId);
    if (Date.now() - new Date(m.createdAt).getTime() > 24 * 3600_000) throw new HttpError(400, "Messages can only be edited within 24 hours");
    const updated = await prisma.message.update({
      where: { id: messageId }, data: { content: content.trim(), isEdited: true },
      include: { sender: { select: userSelect }, attachments: { include: { file: true } } },
    });
    emitToConversation(m.conversationId, "message:updated", messageDto(updated, null));
    return messageDto(updated, user.id);
  },

  async remove(user, messageId) {
    const m = await prisma.message.findUnique({ where: { id: messageId } });
    if (!m || m.senderId !== user.id) throw new HttpError(404, "Message not found");
    await this.assertMember(user, m.conversationId);
    const updated = await prisma.message.update({
      where: { id: messageId }, data: { isDeleted: true },
      include: { sender: { select: userSelect }, attachments: { include: { file: true } } },
    });
    emitToConversation(m.conversationId, "message:updated", messageDto(updated, null));
  },

  async markRead(user, id) {
    await this.assertMember(user, id);
    const at = new Date();
    await prisma.conversationMember.update({ where: { conversationId_userId: { conversationId: id, userId: user.id } }, data: { lastReadAt: at } });
    emitToConversation(id, "conversation:read", { conversationId: id, userId: user.id, at });
    emitToUsers([user.id], "conversation:read", { conversationId: id, userId: user.id, at });
  },
};
