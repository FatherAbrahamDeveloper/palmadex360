import { z } from "zod";

export const REQUEST_STATUSES = ["PENDING", "APPROVED", "IN_PROGRESS", "COMPLETED", "REJECTED", "CANCELLED"];

const optStr = (max) =>
  z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(max).nullable().optional());

const optNum = (positive = false) =>
  z.preprocess(
    (v) => (v === undefined ? undefined : v === "" || v === null ? null : Number(v)),
    (positive ? z.number().positive() : z.number().nonnegative()).nullable().optional()
  );

const optDate = z.preprocess(
  (v) => (v === "" ? null : v),
  z.coerce.date().nullable().optional()
);

const baseSchema = z.object({
  itemName: z.string().trim().min(2, "Item is required").max(191),
  quantity: optNum(true),
  unit: optStr(30),
  estimatedCost: optNum(false),
  currency: z.string().trim().min(1).max(10).optional(),
  supplierId: optStr(40),
  supplierName: optStr(191),
  requiredByDate: optDate,
  notes: optStr(5000),
});

export const createRequestSchema = baseSchema.refine((d) => d.supplierId || d.supplierName, {
  message: "Select a supplier or enter a supplier name",
  path: ["supplierName"],
});

export const updateRequestSchema = baseSchema.partial();

export const changeStatusSchema = z
  .object({
    status: z.enum(REQUEST_STATUSES.filter((s) => s !== "PENDING")),
    note: optStr(2000),
  })
  .superRefine((d, ctx) => {
    if (d.status === "REJECTED" && !d.note) {
      ctx.addIssue({ code: "custom", path: ["note"], message: "A reason is required when rejecting" });
    }
  });

export const listRequestsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(REQUEST_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "requiredByDate", "estimatedCost"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});