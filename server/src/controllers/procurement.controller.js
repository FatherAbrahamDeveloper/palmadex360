import { ZodError } from "zod";
import { procurementService } from "../services/procurement.service.js";
import { HttpError } from "../services/product.service.js";
import {
  createRequestSchema,
  updateRequestSchema,
  changeStatusSchema,
  listRequestsQuerySchema,
} from "../validators/procurement.validator.js";

function handleError(err, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      errors: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
  }
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err?.code === "P2002") return res.status(409).json({ message: "Could not generate a unique request number, please try again" });
  if (err?.code === "P2003") return res.status(400).json({ message: "Invalid supplier selected" });
  return next(err);
}

const wrap = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    handleError(err, res, next);
  }
};

export const procurementController = {
  list: wrap(async (req, res) => {
    const query = listRequestsQuerySchema.parse(req.query);
    res.json(await procurementService.list(req.user.companyId, query));
  }),
  supplierOptions: wrap(async (req, res) => {
    res.json(await procurementService.supplierOptions(req.user.companyId));
  }),
  get: wrap(async (req, res) => {
    res.json({ data: await procurementService.get(req.user.companyId, req.params.id) });
  }),
  create: wrap(async (req, res) => {
    const input = createRequestSchema.parse(req.body);
    res.status(201).json({ data: await procurementService.create(req.user.companyId, req.user.id, input) });
  }),
  update: wrap(async (req, res) => {
    const input = updateRequestSchema.parse(req.body);
    res.json({ data: await procurementService.update(req.user.companyId, req.params.id, input) });
  }),
  changeStatus: wrap(async (req, res) => {
    const input = changeStatusSchema.parse(req.body);
    res.json({
      data: await procurementService.changeStatus(
        req.user.companyId, req.user.id, req.user.role, req.params.id, input
      ),
    });
  }),
  remove: wrap(async (req, res) => {
    await procurementService.remove(req.user.companyId, req.params.id);
    res.status(204).send();
  }),
};