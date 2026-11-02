import { z } from "zod";

export const MOVEMENT_TYPES = ["RECEIPT", "ISSUE", "ADJUSTMENT"];

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

export const createStockSchema = z.object({
  warehouseId: z.string().trim().min(1, "Select a warehouse").max(40),
  productId: z.string().trim().min(1, "Select a product").max(40),
  quantity: reqNum.optional(), // opening balance
  unit: z.string().trim().min(1).max(30).optional(),
  capacity: optNum,
  reorderLevel: optNum,
});

// Quantity itself is only ever changed through movements.
export const updateStockSchema = z.object({
  unit: z.string().trim().min(1).max(30).optional(),
  capacity: optNum,
  reorderLevel: optNum,
});

export const createMovementSchema = z
  .object({
    type: z.enum(MOVEMENT_TYPES),
    quantity: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
      z.number().refine((n) => n !== 0, "Quantity cannot be zero")
    ),
    reference: optStr(100),
    note: optStr(2000),
  })
  .superRefine((d, ctx) => {
    if (d.type !== "ADJUSTMENT" && d.quantity < 0) {
      ctx.addIssue({ code: "custom", path: ["quantity"], message: "Quantity must be greater than 0" });
    }
    if (d.type === "ADJUSTMENT" && !d.note) {
      ctx.addIssue({ code: "custom", path: ["note"], message: "A note is required for adjustments" });
    }
  });

export const listStockQuerySchema = z.object({
  search: z.string().trim().optional(),
  warehouseId: z.string().trim().optional(),
  productId: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  sortBy: z.enum(["productName", "quantity", "updatedAt", "createdAt"]).default("productName"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const listMovementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});