import { z } from "zod";

export const ORDER_STATUSES = ["PENDING", "PROCESSING", "IN_TRANSIT", "DELIVERED", "CANCELLED"];

const optStr = (max) =>
  z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(max).nullable().optional());

const reqNum = z.preprocess(
  (v) => (v === "" || v === null ? undefined : Number(v)),
  z.number().nonnegative()
);

const baseSchema = z.object({
  customerName: z.string().trim().min(2, "Customer name is required").max(191),
  contactId: optStr(40),
  productId: optStr(40),
  productName: optStr(191),
  quantity: reqNum.refine((n) => n > 0, "Quantity must be greater than 0"),
  unit: z.string().trim().min(1).max(30).optional(),
  totalValue: reqNum,
  currency: z.string().trim().min(1).max(10).optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  notes: optStr(5000),
});

export const createExportOrderSchema = baseSchema.refine((d) => d.productId || d.productName, {
  message: "Select a product or enter a product name",
  path: ["productName"],
});

export const updateExportOrderSchema = baseSchema.partial();

export const listExportOrdersQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "totalValue", "customerName"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});