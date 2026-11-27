import { z } from "zod";

const optNull = (max) => z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(max).nullable().optional());

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Customer name is required").max(191),
  email: z.preprocess((v) => (v === "" ? null : v), z.string().trim().toLowerCase().email("Enter a valid email").max(191).nullable().optional()),
  phone: optNull(40),
  country: optNull(100),
  address: optNull(2000),
  notes: optNull(5000),
  contactId: optNull(40),
  isActive: z.boolean().optional(),
});
export const updateCustomerSchema = customerSchema.partial();

export const listCustomersQuery = z.object({
  q: z.string().trim().max(100).optional(),
  active: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const portalOrderSchema = z.object({
  productId: z.string().trim().min(1, "Choose a product").max(40),
  quantity: z.coerce.number().positive("Quantity must be greater than 0").max(1e9),
  unit: z.string().trim().max(30).optional(),
  destination: z.string().trim().min(2, "Enter the destination port or country").max(191),
  requestedDeliveryDate: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.date().optional()),
  notes: optNull(3000),
});
