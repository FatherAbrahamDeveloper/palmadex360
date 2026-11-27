import prisma from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { permissionService } from "./permission.service.js";
import { notificationService } from "./notification.service.js";
import { activityService } from "./activity.service.js";
import { sendMail, appUrl } from "./mail.service.js";
import { emitToUsers } from "../realtime/socket.js";

const OPEN_STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_ON_USER"];
const userSelect = { id: true, firstName: true, lastName: true, email: true, role: true };
const fullName = (u) => (u ? `${u.firstName} ${u.lastName}`.trim() : "Former user");
const pretty = (s) => String(s || "").replace(/_/g, " ").toLowerCase();

const include = {
  createdBy: { select: userSelect },
  assignedTo: { select: userSelect },
  customer: { select: { id: true, name: true } },
  exportOrder: { select: { id: true, orderNumber: true } },
};

export const isAgent = async (user) => user.role !== "CUSTOMER" && (await permissionService.can(user, "support", "EDIT"));

const person = (u) => (u ? { id: u.id, name: fullName(u), email: u.email, role: u.role } : null);

const ticketDto = (t, extra = {}) => ({
  id: t.id, ticketNumber: t.ticketNumber, subject: t.subject, description: t.description,
  category: t.category, priority: t.priority, status: t.status, resolution: t.resolution,
  createdBy: person(t.createdBy), assignedTo: person(t.assignedTo),
  customer: t.customer || null, exportOrder: t.exportOrder || null,
  firstResponseAt: t.firstResponseAt, resolvedAt: t.resolvedAt, closedAt: t.closedAt,
  createdAt: t.createdAt, updatedAt: t.updatedAt, ...extra,
});

const messageDto = (m) => ({
  id: m.id, kind: m.kind, body: m.body, author: person(m.author), createdAt: m.createdAt,
});

// Non-agents see their own tickets, and customers also see their colleagues' tickets.
function visibilityWhere(user, agent) {
  const where = { companyId: user.companyId };
  if (agent) return where;
  if (user.role === "CUSTOMER" && user.customerId) where.OR = [{ createdById: user.id }, { customerId: user.customerId }];
  else where.createdById = user.id;
  return where;
}

async function loadVisible(user, id) {
  const agent = await isAgent(user);
  const ticket = await prisma.supportTicket.findFirst({ where: { id, ...visibilityWhere(user, agent) }, include });
  if (!ticket) throw new HttpError(404, "Ticket not found");
  return { ticket, agent };
}

async function nextTicketNumber(companyId) {
  const prefix = `TKT-${new Date().getFullYear()}-`;
  const last = await prisma.supportTicket.findFirst({
    where: { companyId, ticketNumber: { startsWith: prefix } }, orderBy: { ticketNumber: "desc" }, select: { ticketNumber: true },
  });
  const n = last ? parseInt(last.ticketNumber.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(Number.isNaN(n) ? 1 : n).padStart(4, "0")}`;
}

const involved = (t) => [t.createdById, t.assignedToId].filter(Boolean);
const ping = (t, extra = []) => emitToUsers([...involved(t), ...extra], "ticket:updated", { id: t.id });

export const supportService = {
  async list(user, { q, status, priority, category, assignedToId, scope, page = 1, limit = 20 }) {
    const agent = await isAgent(user);
    const where = visibilityWhere(user, agent);
    if (status === "ACTIVE") where.status = { in: OPEN_STATUSES };
    else if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (agent && assignedToId === "unassigned") where.assignedToId = null;
    else if (agent && assignedToId) where.assignedToId = assignedToId;
    if (agent && scope === "mine") where.assignedToId = user.id;
    if (q) {
      where.AND = [{ OR: [{ ticketNumber: { contains: q, mode: "insensitive" } }, { subject: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] }];
    }
    const [items, total] = await prisma.$transaction([
      prisma.supportTicket.findMany({
        where, include: { ...include, _count: { select: { messages: true } } },
        orderBy: [{ updatedAt: "desc" }], skip: (page - 1) * limit, take: limit,
      }),
      prisma.supportTicket.count({ where }),
    ]);
    return {
      data: items.map((t) => ticketDto(t, { messageCount: t._count.messages })),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), isAgent: agent },
    };
  },

  async stats(user) {
    const agent = await isAgent(user);
    const base = visibilityWhere(user, agent);
    const since = new Date(Date.now() - 30 * 86400_000);
    const [byStatus, unassigned, urgent, mine, resolved] = await Promise.all([
      prisma.supportTicket.groupBy({ by: ["status"], where: base, _count: { _all: true } }),
      agent ? prisma.supportTicket.count({ where: { ...base, assignedToId: null, status: { in: OPEN_STATUSES } } }) : 0,
      prisma.supportTicket.count({ where: { ...base, priority: "URGENT", status: { in: OPEN_STATUSES } } }),
      agent ? prisma.supportTicket.count({ where: { ...base, assignedToId: user.id, status: { in: OPEN_STATUSES } } }) : 0,
      prisma.supportTicket.findMany({ where: { ...base, resolvedAt: { gte: since } }, select: { createdAt: true, resolvedAt: true } }),
    ]);
    const counts = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all]));
    const hours = resolved.map((t) => (t.resolvedAt - t.createdAt) / 3600_000);
    return {
      isAgent: agent,
      open: OPEN_STATUSES.reduce((a, s) => a + (counts[s] || 0), 0),
      byStatus: counts, unassigned, urgent, mine,
      resolvedLast30Days: resolved.length,
      avgResolutionHours: hours.length ? Math.round((hours.reduce((a, b) => a + b, 0) / hours.length) * 10) / 10 : null,
    };
  },

  async agents(user) {
    const staff = await notificationService.usersWithAccess(user.companyId, "support", "EDIT");
    const ids = staff.map((s) => s.id);
    const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: userSelect, orderBy: { firstName: "asc" } });
    return users.map(person);
  },

  async create(user, input) {
    const agent = await isAgent(user);
    let customerId = user.role === "CUSTOMER" ? user.customerId || null : input.customerId || null;
    if (customerId && user.role !== "CUSTOMER" && !(await prisma.customer.findFirst({ where: { id: customerId, companyId: user.companyId } }))) {
      throw new HttpError(400, "Selected customer was not found");
    }
    if (input.exportOrderId) {
      const order = await prisma.exportOrder.findFirst({ where: { id: input.exportOrderId, companyId: user.companyId } });
      if (!order || (user.role === "CUSTOMER" && order.customerId !== user.customerId)) throw new HttpError(400, "Selected order was not found");
      customerId = customerId || order.customerId;
    }
    if (input.assignedToId && !agent) delete input.assignedToId;

    let ticket;
    for (let attempt = 0; attempt < 3 && !ticket; attempt++) {
      try {
        ticket = await prisma.supportTicket.create({
          data: {
            companyId: user.companyId, ticketNumber: await nextTicketNumber(user.companyId),
            subject: input.subject, description: input.description, category: input.category,
            priority: agent ? input.priority : input.priority === "URGENT" && input.category !== "COMPLAINT" ? "HIGH" : input.priority,
            createdById: user.id, customerId, exportOrderId: input.exportOrderId || null,
            assignedToId: input.assignedToId || null,
          },
          include,
        });
      } catch (err) {
        if (err?.code !== "P2002" || attempt === 2) throw err;
      }
    }

    activityService.record({
      companyId: user.companyId, userId: user.id, action: "opened", entity: "SupportTicket", entityId: ticket.id,
      summary: `opened support ticket ${ticket.ticketNumber}: ${ticket.subject}`, link: `/support?t=${ticket.id}`,
    });

    const staff = (await notificationService.usersWithAccess(user.companyId, "support", "EDIT")).filter((s) => s.id !== user.id);
    await notificationService.notifyMany(staff.map((s) => s.id), {
      companyId: user.companyId, title: `New ticket ${ticket.ticketNumber}`,
      message: `${fullName(user)}: ${ticket.subject} (${pretty(ticket.priority)} priority)`,
      type: "ticket.new", link: `/support?t=${ticket.id}`,
    });
    const recipients = ticket.assignedTo ? [ticket.assignedTo] : staff;
    for (const s of recipients) {
      sendMail({
        to: s.email, subject: `[${ticket.ticketNumber}] ${ticket.subject}`,
        heading: `New ${pretty(ticket.category)} ticket from ${fullName(user)}`,
        paragraphs: [ticket.description.slice(0, 800), `Priority: ${pretty(ticket.priority)}`],
        action: { label: "Open ticket", url: appUrl(`/support?t=${ticket.id}`) },
      });
    }
    sendMail({
      to: user.email, subject: `We received your request [${ticket.ticketNumber}]`,
      heading: "Your support ticket is open",
      paragraphs: [`Thank you, ${user.firstName}. Your ticket ${ticket.ticketNumber} "${ticket.subject}" has been received.`, "We will reply here and by email as soon as possible."],
      action: { label: "View ticket", url: appUrl(`/support?t=${ticket.id}`) },
    });
    ping(ticket, staff.map((s) => s.id));
    return ticketDto(ticket);
  },

  async get(user, id) {
    const { ticket, agent } = await loadVisible(user, id);
    const messages = await prisma.ticketMessage.findMany({
      where: { ticketId: id, ...(agent ? {} : { kind: { not: "NOTE" } }) },
      include: { author: { select: userSelect } },
      orderBy: { createdAt: "asc" },
    });
    return ticketDto(ticket, { messages: messages.map(messageDto), isAgent: agent, canManage: agent });
  },

  async reply(user, id, { body, internal }) {
    const { ticket, agent } = await loadVisible(user, id);
    if (internal && !agent) throw new HttpError(403, "Only support staff can add internal notes");
    if (ticket.status === "CLOSED" && !agent) throw new HttpError(400, "This ticket is closed. Please open a new ticket.");

    const kind = internal ? "NOTE" : "REPLY";
    const msg = await prisma.ticketMessage.create({ data: { ticketId: id, authorId: user.id, kind, body }, include: { author: { select: userSelect } } });

    const data = {};
    const fromRequesterSide = !agent;
    if (!internal) {
      if (agent && !ticket.firstResponseAt && ticket.createdById !== user.id) data.firstResponseAt = new Date();
      if (agent && ticket.status === "OPEN") data.status = "IN_PROGRESS";
      if (fromRequesterSide && ["WAITING_ON_USER", "RESOLVED"].includes(ticket.status)) {
        data.status = "OPEN";
        data.resolvedAt = null;
      }
    }
    const updated = await prisma.supportTicket.update({ where: { id }, data: { ...data, updatedAt: new Date() }, include });

    if (!internal) {
      if (agent && ticket.createdById && ticket.createdById !== user.id) {
        await notificationService.notify({
          userId: ticket.createdById, companyId: user.companyId, title: `Reply on ${ticket.ticketNumber}`,
          message: `${fullName(user)}: ${body.slice(0, 160)}`, type: "ticket.reply", link: `/support?t=${id}`,
          email: {
            to: ticket.createdBy?.email, heading: `New reply on your ticket ${ticket.ticketNumber}`,
            paragraphs: [`${fullName(user)} replied:`, body.slice(0, 2000)],
            action: { label: "View and reply", url: appUrl(`/support?t=${id}`) },
          },
        });
      } else if (fromRequesterSide) {
        const targets = ticket.assignedTo ? [ticket.assignedTo] : await notificationService.usersWithAccess(user.companyId, "support", "EDIT");
        await notificationService.notifyMany(targets.map((t) => t.id), {
          companyId: user.companyId, title: `Customer reply on ${ticket.ticketNumber}`,
          message: `${fullName(user)}: ${body.slice(0, 160)}`, type: "ticket.reply", link: `/support?t=${id}`,
        });
        if (ticket.assignedTo) {
          sendMail({
            to: ticket.assignedTo.email, subject: `Re: [${ticket.ticketNumber}] ${ticket.subject}`,
            heading: `${fullName(user)} replied`, paragraphs: [body.slice(0, 2000)],
            action: { label: "Open ticket", url: appUrl(`/support?t=${id}`) },
          });
        }
      }
    }
    ping(updated);
    return messageDto(msg);
  },

  async update(user, id, input) {
    const { ticket, agent } = await loadVisible(user, id);
    if (!agent) throw new HttpError(403, "Only support staff can update tickets");

    if (input.assignedToId) {
      const agents = await this.agents(user);
      if (!agents.some((a) => a.id === input.assignedToId)) throw new HttpError(400, "That person cannot be assigned support tickets");
    }
    const data = { ...input };
    const notes = [];
    if (input.status && input.status !== ticket.status) {
      notes.push(`Status changed from ${pretty(ticket.status)} to ${pretty(input.status)}`);
      if (input.status === "RESOLVED") data.resolvedAt = new Date();
      if (input.status === "CLOSED") data.closedAt = new Date();
      if (OPEN_STATUSES.includes(input.status)) { data.resolvedAt = null; data.closedAt = null; }
    }
    if (input.priority && input.priority !== ticket.priority) notes.push(`Priority changed to ${pretty(input.priority)}`);
    if (input.category && input.category !== ticket.category) notes.push(`Category changed to ${pretty(input.category)}`);
    if (input.assignedToId !== undefined && input.assignedToId !== ticket.assignedToId) {
      const assignee = input.assignedToId ? await prisma.user.findUnique({ where: { id: input.assignedToId }, select: userSelect }) : null;
      notes.push(assignee ? `Assigned to ${fullName(assignee)}` : "Unassigned");
    }

    const updated = await prisma.supportTicket.update({ where: { id }, data, include });
    if (notes.length) {
      await prisma.ticketMessage.create({ data: { ticketId: id, authorId: user.id, kind: "SYSTEM", body: notes.join(". ") } });
    }

    if (input.assignedToId && input.assignedToId !== ticket.assignedToId && input.assignedToId !== user.id) {
      await notificationService.notify({
        userId: input.assignedToId, companyId: user.companyId, title: `${ticket.ticketNumber} assigned to you`,
        message: `${fullName(user)} assigned you "${ticket.subject}".`, type: "ticket.assigned", link: `/support?t=${id}`,
        email: {
          to: updated.assignedTo?.email, heading: `Ticket ${ticket.ticketNumber} was assigned to you`,
          paragraphs: [ticket.subject, `Priority: ${pretty(updated.priority)}`],
          action: { label: "Open ticket", url: appUrl(`/support?t=${id}`) },
        },
      });
    }
    if (input.status && input.status !== ticket.status && ticket.createdById && ticket.createdById !== user.id) {
      const resolved = input.status === "RESOLVED";
      await notificationService.notify({
        userId: ticket.createdById, companyId: user.companyId,
        title: resolved ? `${ticket.ticketNumber} has been resolved` : `${ticket.ticketNumber} is now ${pretty(input.status)}`,
        message: resolved ? (input.resolution || updated.resolution || "Your issue has been resolved.") : `Your ticket "${ticket.subject}" is now ${pretty(input.status)}.`,
        type: "ticket.status", link: `/support?t=${id}`,
        email: resolved || input.status === "WAITING_ON_USER" ? {
          to: ticket.createdBy?.email,
          heading: resolved ? "Your ticket has been resolved" : "We need more information",
          paragraphs: [
            `Ticket ${ticket.ticketNumber}: ${ticket.subject}`,
            ...(resolved && (input.resolution || updated.resolution) ? [`Resolution: ${input.resolution || updated.resolution}`] : []),
            resolved ? "If the problem continues, reply on the ticket and it will reopen." : "Please reply on the ticket so we can continue.",
          ],
          action: { label: "View ticket", url: appUrl(`/support?t=${id}`) },
        } : undefined,
      });
    }
    if (input.status && input.status !== ticket.status) {
      activityService.record({
        companyId: user.companyId, userId: user.id, action: "changed the status of", entity: "SupportTicket", entityId: id,
        label: ticket.ticketNumber, status: input.status,
      });
    }
    ping(updated, [ticket.assignedToId]);
    return ticketDto(updated);
  },

  // Requester closes their own ticket, or reopens it.
  async setOwnStatus(user, id, action) {
    const { ticket, agent } = await loadVisible(user, id);
    if (!agent && ticket.createdById !== user.id && !(user.customerId && ticket.customerId === user.customerId)) {
      throw new HttpError(403, "You cannot change this ticket");
    }
    let data;
    if (action === "close") {
      if (ticket.status === "CLOSED") throw new HttpError(400, "This ticket is already closed");
      data = { status: "CLOSED", closedAt: new Date() };
    } else {
      if (!["RESOLVED", "CLOSED"].includes(ticket.status)) throw new HttpError(400, "Only resolved or closed tickets can be reopened");
      if (ticket.closedAt && Date.now() - new Date(ticket.closedAt).getTime() > 30 * 86400_000) {
        throw new HttpError(400, "This ticket was closed more than 30 days ago. Please open a new ticket.");
      }
      data = { status: "OPEN", resolvedAt: null, closedAt: null };
    }
    const updated = await prisma.supportTicket.update({ where: { id }, data, include });
    await prisma.ticketMessage.create({ data: { ticketId: id, authorId: user.id, kind: "SYSTEM", body: `${fullName(user)} ${action === "close" ? "closed" : "reopened"} the ticket` } });
    if (action === "reopen") {
      const targets = ticket.assignedTo ? [ticket.assignedTo] : await notificationService.usersWithAccess(user.companyId, "support", "EDIT");
      await notificationService.notifyMany(targets.map((t) => t.id).filter((x) => x !== user.id), {
        companyId: user.companyId, title: `${ticket.ticketNumber} was reopened`, message: ticket.subject, type: "ticket.reopened", link: `/support?t=${id}`,
      });
    }
    ping(updated);
    return ticketDto(updated);
  },

  async remove(user, id) {
    const { ticket } = await loadVisible(user, id);
    if (!(await permissionService.can(user, "support", "FULL")) || user.role === "CUSTOMER") throw new HttpError(403, "You cannot delete tickets");
    await prisma.supportTicket.delete({ where: { id: ticket.id } });
  },
};
