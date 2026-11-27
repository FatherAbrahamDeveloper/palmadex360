import { z } from "zod";
import { ROLE_IDS } from "../config/access.js";

const optNull = (max) => z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(max).nullable().optional());

export const listUsersQuery = z.object({
  q: z.string().trim().max(100).optional(),
  role: z.enum(ROLE_IDS).optional(),
  status: z.enum(["PENDING", "ACTIVE", "INACTIVE", "REJECTED", "FACE_PENDING"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const inviteUserSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().toLowerCase().email("A valid email address is required").max(191),
  phone: optNull(40),
  organization: optNull(191),
  role: z.enum(ROLE_IDS),
  customerId: optNull(40),
  newCustomerName: optNull(191),
});

export const updateUserSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  phone: optNull(40),
  organization: optNull(191),
  role: z.enum(ROLE_IDS).optional(),
  isActive: z.boolean().optional(),
  customerId: optNull(40),
});

export const approveUserSchema = z.object({
  role: z.enum(ROLE_IDS),
  customerId: optNull(40),
  customerName: optNull(191),
});

export const rejectUserSchema = z.object({ reason: optNull(500) });
export const faceReviewSchema = z.object({ decision: z.enum(["APPROVED", "REJECTED"]), note: optNull(300) });

export const permissionChangesSchema = z.object({
  changes: z.array(z.object({
    role: z.enum(ROLE_IDS),
    module: z.string().max(40),
    access: z.enum(["NONE", "VIEW", "EDIT", "FULL"]),
  })).min(1).max(500),
});
