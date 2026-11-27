import { supportService as svc } from "../services/support.service.js";
import * as v from "../validators/support.validator.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const supportController = {
  list: asyncHandler(async (req, res) => res.json(await svc.list(req.user, v.listTicketsQuery.parse(req.query)))),
  stats: asyncHandler(async (req, res) => res.json({ data: await svc.stats(req.user) })),
  agents: asyncHandler(async (req, res) => res.json({ data: await svc.agents(req.user) })),
  create: asyncHandler(async (req, res) => res.status(201).json({ data: await svc.create(req.user, v.createTicketSchema.parse(req.body)) })),
  get: asyncHandler(async (req, res) => res.json({ data: await svc.get(req.user, req.params.id) })),
  reply: asyncHandler(async (req, res) => res.status(201).json({ data: await svc.reply(req.user, req.params.id, v.replySchema.parse(req.body)) })),
  update: asyncHandler(async (req, res) => res.json({ data: await svc.update(req.user, req.params.id, v.updateTicketSchema.parse(req.body)) })),
  close: asyncHandler(async (req, res) => res.json({ data: await svc.setOwnStatus(req.user, req.params.id, "close") })),
  reopen: asyncHandler(async (req, res) => res.json({ data: await svc.setOwnStatus(req.user, req.params.id, "reopen") })),
  remove: asyncHandler(async (req, res) => { await svc.remove(req.user, req.params.id); res.status(204).send(); }),
};
