import { Server } from "socket.io";
import { resolveUserFromToken } from "../middleware/auth.middleware.js";

// Socket.IO is free and self-hosted. It uses WebSockets where the host allows them
// and falls back to HTTP long-polling automatically (some hosts and proxies block WebSockets).
let io = null;
const online = new Map(); // userId -> number of open sockets

export const userRoom = (id) => `user:${id}`;
export const companyRoom = (id) => `company:${id}`;
export const conversationRoom = (id) => `conversation:${id}`;

export function initRealtime(httpServer, { origins }) {
  io = new Server(httpServer, {
    path: "/socket.io",
    cors: { origin: origins, credentials: true },
    transports: ["websocket", "polling"],
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const user = token ? await resolveUserFromToken(token) : null;
      if (!user) return next(new Error("unauthorized"));
      socket.data.user = user;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const user = socket.data.user;
    socket.join(userRoom(user.id));
    socket.join(companyRoom(user.companyId));
    online.set(user.id, (online.get(user.id) || 0) + 1);
    if (online.get(user.id) === 1) io.to(companyRoom(user.companyId)).emit("presence", { userId: user.id, online: true });

    // Conversation rooms are joined only after the membership check in the messaging service.
    socket.on("conversation:join", async (conversationId, ack) => {
      try {
        const { messagingService } = await import("../services/messaging.service.js");
        await messagingService.assertMember(user, conversationId);
        socket.join(conversationRoom(conversationId));
        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false });
      }
    });
    socket.on("conversation:leave", (conversationId) => socket.leave(conversationRoom(conversationId)));

    socket.on("typing", ({ conversationId, typing } = {}) => {
      if (!conversationId || !socket.rooms.has(conversationRoom(conversationId))) return;
      socket.to(conversationRoom(conversationId)).emit("typing", {
        conversationId,
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        typing: !!typing,
      });
    });

    socket.on("disconnect", () => {
      const left = (online.get(user.id) || 1) - 1;
      if (left <= 0) {
        online.delete(user.id);
        io.to(companyRoom(user.companyId)).emit("presence", { userId: user.id, online: false });
      } else online.set(user.id, left);
    });
  });

  return io;
}

export const isOnline = (userId) => online.has(userId);
export const onlineUserIds = () => [...online.keys()];

export function emitToUser(userId, event, payload) {
  if (io && userId) io.to(userRoom(userId)).emit(event, payload);
}
export function emitToUsers(userIds, event, payload) {
  if (!io) return;
  const rooms = [...new Set(userIds.filter(Boolean))].map(userRoom);
  if (rooms.length) io.to(rooms).emit(event, payload);
}
export function emitToCompany(companyId, event, payload) {
  if (io && companyId) io.to(companyRoom(companyId)).emit(event, payload);
}
export function emitToConversation(conversationId, event, payload) {
  if (io) io.to(conversationRoom(conversationId)).emit(event, payload);
}
