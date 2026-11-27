import { messagingService as svc } from "../services/messaging.service.js";
import * as v from "../validators/communication.validator.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const q = (req) => (req.query.q ? String(req.query.q).slice(0, 100) : "");

export const communicationController = {
  directory: asyncHandler(async (req, res) => res.json({ data: await svc.directory(req.user, { q: q(req) }) })),
  list: asyncHandler(async (req, res) => res.json({ data: await svc.list(req.user, { q: q(req) }) })),
  unread: asyncHandler(async (req, res) => res.json({ data: { unread: await svc.unreadTotal(req.user) } })),
  create: asyncHandler(async (req, res) => res.status(201).json({ data: await svc.create(req.user, v.createConversationSchema.parse(req.body)) })),
  get: asyncHandler(async (req, res) => res.json({ data: await svc.get(req.user, req.params.id) })),
  rename: asyncHandler(async (req, res) => res.json({ data: await svc.rename(req.user, req.params.id, v.renameSchema.parse(req.body).title) })),
  addMembers: asyncHandler(async (req, res) => res.json({ data: await svc.addMembers(req.user, req.params.id, v.addMembersSchema.parse(req.body).userIds) })),
  leave: asyncHandler(async (req, res) => { await svc.leave(req.user, req.params.id); res.status(204).send(); }),
  messages: asyncHandler(async (req, res) => res.json(await svc.messages(req.user, req.params.id, {
    before: req.query.before ? String(req.query.before) : undefined,
    limit: Math.max(1, Math.min(100, Number(req.query.limit) || 40)),
  }))),
  send: asyncHandler(async (req, res) => res.status(201).json({ data: await svc.send(req.user, req.params.id, v.sendMessageSchema.parse(req.body)) })),
  edit: asyncHandler(async (req, res) => res.json({ data: await svc.edit(req.user, req.params.messageId, v.editMessageSchema.parse(req.body).content) })),
  remove: asyncHandler(async (req, res) => { await svc.remove(req.user, req.params.messageId); res.status(204).send(); }),
  read: asyncHandler(async (req, res) => { await svc.markRead(req.user, req.params.id); res.status(204).send(); }),
};
