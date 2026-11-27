import prisma from "../config/prisma.js";
import { emitToUser } from "../realtime/socket.js";
import { sendMail } from "./mail.service.js";

const toDto = (n) => ({
  id: n.id, title: n.title, message: n.message, type: n.type, link: n.link,
  isRead: n.isRead, createdAt: n.createdAt,
});

export const notificationService = {
  // In-app notification, pushed live. Pass `email` to also send an email.
  async notify({ userId, companyId, title, message, type, link, email }) {
    const n = await prisma.notification.create({
      data: { userId, companyId: companyId || null, title, message, type: type || null, link: link || null },
    });
    emitToUser(userId, "notification:new", toDto(n));
    if (email?.to) sendMail({ subject: title, heading: title, ...email }).catch(() => {});
    return toDto(n);
  },

  async notifyMany(userIds, data) {
    const unique = [...new Set(userIds.filter(Boolean))];
    return Promise.all(unique.map((userId) => this.notify({ ...data, userId })));
  },

  async list(userId, { unreadOnly = false, limit = 20, before } = {}) {
    const where = { userId, ...(unreadOnly ? { isRead: false } : {}), ...(before ? { createdAt: { lt: new Date(before) } } : {}) };
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: limit }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { data: items.map(toDto), meta: { unread } };
  },

  async markRead(userId, id) {
    await prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  },

  async markAllRead(userId) {
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  },

  // Users with at least `level` on `module` (plus Super Admins), for routing alerts.
  async usersWithAccess(companyId, module, level = "EDIT") {
    const { permissionService } = await import("./permission.service.js");
    const users = await prisma.user.findMany({
      where: { companyId, isActive: true, approvalStatus: "APPROVED", role: { not: "CUSTOMER" } },
      select: { id: true, email: true, role: true, firstName: true },
    });
    const result = [];
    for (const u of users) {
      if (await permissionService.can({ ...u, companyId }, module, level)) result.push(u);
    }
    return result;
  },
};
