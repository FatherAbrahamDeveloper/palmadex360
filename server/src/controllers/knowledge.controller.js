import { knowledgeService as svc } from "../services/knowledge.service.js";
import * as v from "../validators/knowledge.validator.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const knowledgeController = {
  categories: asyncHandler(async (req, res) => res.json({ data: await svc.categories(req.user) })),
  createCategory: asyncHandler(async (req, res) => res.status(201).json({ data: await svc.createCategory(req.user, v.categorySchema.parse(req.body)) })),
  updateCategory: asyncHandler(async (req, res) => res.json({ data: await svc.updateCategory(req.user, req.params.id, v.categorySchema.partial().parse(req.body)) })),
  removeCategory: asyncHandler(async (req, res) => { await svc.removeCategory(req.user, req.params.id); res.status(204).send(); }),
  list: asyncHandler(async (req, res) => res.json(await svc.list(req.user, v.listArticlesQuery.parse(req.query)))),
  get: asyncHandler(async (req, res) => res.json({ data: await svc.get(req.user, req.params.idOrSlug, { countView: req.query.preview !== "1" }) })),
  create: asyncHandler(async (req, res) => res.status(201).json({ data: await svc.create(req.user, v.articleSchema.parse(req.body)) })),
  update: asyncHandler(async (req, res) => res.json({ data: await svc.update(req.user, req.params.id, v.updateArticleSchema.parse(req.body)) })),
  remove: asyncHandler(async (req, res) => { await svc.remove(req.user, req.params.id); res.status(204).send(); }),
  feedback: asyncHandler(async (req, res) => res.json({ data: await svc.feedback(req.user, req.params.id, v.feedbackSchema.parse(req.body).helpful) })),
};
