import { z } from "zod";

export const SHIPMENT_STATUSES = ["BOOKED", "LOADING", "AT_SEA", "CUSTOMS", "ARRIVED", "CANCELLED"];

const optStr = (max) =>
  z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(max).nullable().optional());

const optDate = z.preprocess(
  (v) => (v === "" ? null : v),
  z.coerce.date().nullable().optional()
);

export const createShipmentSchema = z.object({
  vesselName: z.string().trim().min(2, "Vessel name is required").max(191),
  voyageNumber: optStr(50),
  shippingLine: optStr(100),
  bookingNumber: optStr(50),
  billOfLadingNumber: optStr(50),
  originPort: z.string().trim().min(2, "Origin port is required").max(191),
  destinationPort: z.string().trim().min(2, "Destination port is required").max(191),
  etd: optDate,
  eta: optDate,
  containerCount: z.coerce.number().int().min(1, "At least 1 container").max(9999).optional(),
  status: z.enum(SHIPMENT_STATUSES).optional(),
  notes: optStr(5000),
  orderIds: z.array(z.string().trim().min(1).max(40)).max(50).optional(),
});

export const updateShipmentSchema = createShipmentSchema.partial();

export const listShipmentsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(SHIPMENT_STATUSES).optional(),
  exportOrderId: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "eta", "etd", "vesselName"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});