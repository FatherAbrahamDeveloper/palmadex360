import { z } from "zod";

const optStr = (max) =>
  z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(max).nullable().optional());

export const createWarehouseSchema = z.object({
  name: z.string().trim().min(2, "Warehouse name is required").max(150),
  code: optStr(20),
  city: optStr(100),
  state: optStr(100),
  address: optStr(1000),
  isActive: z.boolean().optional(),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();