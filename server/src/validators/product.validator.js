import { z } from "zod";

const optStr = (max) =>
  z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(max).nullable().optional());

const optNum = z.preprocess(
  (v) => (v === undefined ? undefined : v === "" || v === null ? null : Number(v)),
  z.number().nonnegative().nullable().optional()
);

const reqNum = z.preprocess(
  (v) => (v === "" || v === null ? undefined : Number(v)),
  z.number().nonnegative()
);

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(191),
  categoryId: optStr(40),
  sku: optStr(50),
  description: optStr(5000),
  unit: optStr(30),
  price: optNum,
priceUpdatedAt: z.coerce.date().nullable().optional(),
  currency: optStr(10),
  stockQuantity: reqNum.optional(),
  minimumOrderQuantity: optNum,
  hsCode: optStr(20),
  originCountry: optStr(100),
  packaging: optStr(2000),
  specifications: optStr(5000),
  isNewListing: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const listProductsQuerySchema = z.object({
  search: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  status: z.enum(["active", "inactive", "out_of_stock"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["name", "price", "stockQuantity", "createdAt", "updatedAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});
