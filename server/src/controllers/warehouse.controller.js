import { ZodError } from "zod";
import { warehouseService } from "../services/warehouse.service.js";
import { HttpError } from "../services/product.service.js";
import { createWarehouseSchema, updateWarehouseSchema } from "../validators/warehouse.validator.js";

function handleError(err, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      errors: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
  }
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err?.code === "P2002") return res.status(409).json({ message: "A warehouse with this name already exists" });
  if (err?.code === "P2003") return res.status(409).json({ message: "This warehouse still holds stock items. Remove them first." });
  return next(err);
}

const wrap = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    handleError(err, res, next);
  }
};

export const warehouseController = {
  list: wrap(async (req, res) => {
    res.json(await warehouseService.list(req.user.companyId));
  }),
  create: wrap(async (req, res) => {
    const input = createWarehouseSchema.parse(req.body);
    res.status(201).json({ data: await warehouseService.create(req.user.companyId, input) });
  }),
  update: wrap(async (req, res) => {
    const input = updateWarehouseSchema.parse(req.body);
    res.json({ data: await warehouseService.update(req.user.companyId, req.params.id, input) });
  }),
  remove: wrap(async (req, res) => {
    await warehouseService.remove(req.user.companyId, req.params.id);
    res.status(204).send();
  }),
};