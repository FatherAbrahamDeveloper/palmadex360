import { ZodError } from "zod";
import { complianceService } from "../services/compliance.service.js";
import { HttpError } from "../services/product.service.js";

import {
  createRequirementSchema,
  updateRequirementSchema,
  listRequirementsQuerySchema,
  attachDocumentSchema,
  updateDocumentSchema,
} from "../validators/compliance.validator.js";

function handleError(err, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      errors: err.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      message: err.message,
    });
  }

  if (err?.code === "P2002") {
    return res.status(409).json({
      message: "This compliance record already exists",
    });
  }

  if (err?.code === "P2003") {
    return res.status(400).json({
      message: "Invalid related record selected",
    });
  }

  return next(err);
}

const wrap = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    handleError(err, res, next);
  }
};

export const complianceController = {
  list: wrap(async (req, res) => {
    const query = listRequirementsQuerySchema.parse(req.query);

    res.json(
      await complianceService.list(req.user.companyId, query)
    );
  }),

  get: wrap(async (req, res) => {
    res.json({
      data: await complianceService.get(
        req.user.companyId,
        req.params.id
      ),
    });
  }),

  create: wrap(async (req, res) => {
    const input = createRequirementSchema.parse(req.body);

    res.status(201).json({
      data: await complianceService.create(
        req.user.companyId,
        req.user.id,
        input
      ),
    });
  }),

  update: wrap(async (req, res) => {
    const input = updateRequirementSchema.parse(req.body);

    res.json({
      data: await complianceService.update(
        req.user.companyId,
        req.params.id,
        req.user.id,
        input
      ),
    });
  }),

  remove: wrap(async (req, res) => {
    await complianceService.remove(
      req.user.companyId,
      req.params.id
    );

    res.status(204).send();
  }),

  history: wrap(async (req, res) => {
    res.json(
      await complianceService.history(
        req.user.companyId,
        req.params.id
      )
    );
  }),

  attachDocument: wrap(async (req, res) => {
    const input = attachDocumentSchema.parse(req.body);

    res.status(201).json({
      data: await complianceService.attachDocument(
        req.user.companyId,
        req.user.id,
        req.params.id,
        input
      ),
    });
  }),

  updateDocument: wrap(async (req, res) => {
    const input = updateDocumentSchema.parse(req.body);

    res.json({
      data: await complianceService.updateDocument(
        req.user.companyId,
        req.user.id,
        req.params.id,
        req.params.documentId,
        input
      ),
    });
  }),

  removeDocument: wrap(async (req, res) => {
    await complianceService.removeDocument(
      req.user.companyId,
      req.user.id,
      req.params.id,
      req.params.documentId
    );

    res.status(204).send();
  }),
};