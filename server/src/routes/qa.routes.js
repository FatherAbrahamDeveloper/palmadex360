import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { qaService } from "../services/qa.service.js";
import * as v from "../validators/qa.validator.js";

// Quality checklists (QA/QC), mounted at /api/v1/procurement/qa. Procurement access
// applies (reads VIEW, writes EDIT, deletes FULL); templates also need FULL, and
// overriding a failure needs the Administrator or Super Admin role (checked in the service).
const router = Router();

router.get("/options", asyncHandler(async (req, res) => res.json(await qaService.options(req.user))));

router.get("/templates", asyncHandler(async (req, res) =>
  res.json(await qaService.listTemplates(req.user, { includeInactive: req.query.includeInactive === "true" }))));
router.get("/templates/:id", asyncHandler(async (req, res) => res.json({ data: await qaService.getTemplate(req.user, req.params.id) })));
router.post("/templates", asyncHandler(async (req, res) =>
  res.status(201).json({ data: await qaService.createTemplate(req.user, v.templateSchema.parse(req.body)) })));
router.patch("/templates/:id", asyncHandler(async (req, res) =>
  res.json({ data: await qaService.updateTemplate(req.user, req.params.id, v.templateUpdateSchema.parse(req.body)) })));
router.delete("/templates/:id", asyncHandler(async (req, res) => res.json(await qaService.removeTemplate(req.user, req.params.id))));

router.get("/inspections", asyncHandler(async (req, res) =>
  res.json(await qaService.list(req.user, v.listInspectionsQuerySchema.parse(req.query)))));
router.get("/inspections/:id", asyncHandler(async (req, res) => res.json({ data: await qaService.get(req.user, req.params.id) })));
router.post("/inspections", asyncHandler(async (req, res) =>
  res.status(201).json({ data: await qaService.create(req.user, v.createInspectionSchema.parse(req.body)) })));
router.patch("/inspections/:id", asyncHandler(async (req, res) =>
  res.json({ data: await qaService.update(req.user, req.params.id, v.updateInspectionSchema.parse(req.body)) })));
router.post("/inspections/:id/submit", asyncHandler(async (req, res) =>
  res.json({ data: await qaService.submit(req.user, req.params.id, v.submitInspectionSchema.parse(req.body)) })));
router.post("/inspections/:id/override", asyncHandler(async (req, res) =>
  res.json({ data: await qaService.override(req.user, req.params.id, v.overrideSchema.parse(req.body)) })));
// Deleting a draft is an everyday action, so it needs EDIT (not FULL) like the rest.
router.delete("/inspections/:id", asyncHandler(async (req, res) => { await qaService.remove(req.user, req.params.id); res.status(204).send(); }));

export default router;
