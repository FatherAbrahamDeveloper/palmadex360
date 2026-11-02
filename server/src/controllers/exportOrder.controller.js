import { ZodError } from "zod";
import { exportOrderService } from "../services/exportOrder.service.js";
import { HttpError } from "../services/product.service.js";
import {
  createExportOrderSchema,
  updateExportOrderSchema,
  listExportOrdersQuerySchema,
} from "../validators/exportOrder.validator.js";

function handleError(err, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      errors: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
  }
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err?.code === "P2002") return res.status(409).json({ message: "Could not generate a unique order number, please try again" });
  if (err?.code === "P2003") return res.status(400).json({ message: "Invalid product or contact selected" });
  return next(err);
}

const wrap = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    handleError(err, res, next);
  }
};

export const exportOrderController = {
  list: wrap(async (req, res) => {
    const query = listExportOrdersQuerySchema.parse(req.query);
    res.json(await exportOrderService.list(req.user.companyId, query));
  }),
  get: wrap(async (req, res) => {
    res.json({ data: await exportOrderService.get(req.user.companyId, req.params.id) });
  }),
  create: wrap(async (req, res) => {
    const input = createExportOrderSchema.parse(req.body);
    res.status(201).json({ data: await exportOrderService.create(req.user.companyId, req.user.id, input) });
  }),
  update: wrap(async (req, res) => {
    const input = updateExportOrderSchema.parse(req.body);
    res.json({ data: await exportOrderService.update(req.user.companyId, req.params.id, input) });
  }),
  remove: wrap(async (req, res) => {
    await exportOrderService.remove(req.user.companyId, req.params.id);
    res.status(204).send();
  }),
};