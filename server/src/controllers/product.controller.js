import { ZodError } from "zod";
import { productService, HttpError } from "../services/product.service.js";
import { createProductSchema, updateProductSchema, listProductsQuerySchema } from "../validators/product.validator.js";

function handleError(err, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      errors: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
  }
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err?.code === "P2002") return res.status(409).json({ message: "A product with this SKU already exists" });
  if (err?.code === "P2003") return res.status(400).json({ message: "Invalid category selected" });
  return next(err);
}

const wrap = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    handleError(err, res, next);
  }
};

export const productController = {
  list: wrap(async (req, res) => {
    const query = listProductsQuerySchema.parse(req.query);
    res.json(await productService.list(req.user.companyId, query));
  }),
  categories: wrap(async (_req, res) => {
    res.json({ data: await productService.categories() });
  }),
  get: wrap(async (req, res) => {
    res.json({ data: await productService.get(req.user.companyId, req.params.id) });
  }),
  create: wrap(async (req, res) => {
    const input = createProductSchema.parse(req.body);
    res.status(201).json({ data: await productService.create(req.user.companyId, input) });
  }),
  update: wrap(async (req, res) => {
    const input = updateProductSchema.parse(req.body);
    res.json({ data: await productService.update(req.user.companyId, req.params.id, input) });
  }),
  remove: wrap(async (req, res) => {
    await productService.remove(req.user.companyId, req.params.id);
    res.status(204).send();
  }),
};
