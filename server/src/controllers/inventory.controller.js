import { ZodError } from "zod";
import { inventoryService } from "../services/inventory.service.js";
import { HttpError } from "../services/product.service.js";
import {
  createStockSchema,
  updateStockSchema,
  createMovementSchema,
  listStockQuerySchema,
  listMovementsQuerySchema,
} from "../validators/inventory.validator.js";

function handleError(err, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      errors: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
  }
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err?.code === "P2002") return res.status(409).json({ message: "This product is already stocked in this warehouse" });
  if (err?.code === "P2003") return res.status(400).json({ message: "Invalid warehouse or product selected" });
  return next(err);
}

const wrap = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    handleError(err, res, next);
  }
};

export const inventoryController = {
  list: wrap(async (req, res) => {
    const query = listStockQuerySchema.parse(req.query);
    res.json(await inventoryService.list(req.user.companyId, query));
  }),
  get: wrap(async (req, res) => {
    res.json({ data: await inventoryService.get(req.user.companyId, req.params.id) });
  }),
  create: wrap(async (req, res) => {
    const input = createStockSchema.parse(req.body);
    res.status(201).json({ data: await inventoryService.create(req.user.companyId, req.user.id, input) });
  }),
  update: wrap(async (req, res) => {
    const input = updateStockSchema.parse(req.body);
    res.json({ data: await inventoryService.update(req.user.companyId, req.params.id, input) });
  }),
  remove: wrap(async (req, res) => {
    await inventoryService.remove(req.user.companyId, req.params.id);
    res.status(204).send();
  }),
  movements: wrap(async (req, res) => {
    const query = listMovementsQuerySchema.parse(req.query);
    res.json(await inventoryService.listMovements(req.user.companyId, req.params.id, query));
  }),
  recordMovement: wrap(async (req, res) => {
    const input = createMovementSchema.parse(req.body);
    res.status(201).json({
      data: await inventoryService.recordMovement(req.user.companyId, req.user.id, req.params.id, input),
    });
  }),
};