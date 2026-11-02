import { z } from "zod";

export const COMPLIANCE_STATUSES = [
  "NOT_STARTED",
  "DOCUMENTATION_PENDING",
  "IN_REVIEW",
  "COMPLIANT",
  "ACTION_REQUIRED",
  "EXPIRED",
];

export const COMPLIANCE_RISK_LEVELS = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

export const DOCUMENT_STATUSES = [
  "PENDING",
  "VERIFIED",
  "REJECTED",
];

const optStr = (max) =>
  z.preprocess(
    (v) => (v === "" ? null : v),
    z.string().trim().max(max).nullable().optional()
  );

const optionalDate = z.preprocess(
  (v) => (v === "" || v === null ? null : v),
  z.coerce.date().nullable().optional()
);

const baseRequirement = z.object({
  title: z.string().trim().min(2).max(191),
  region: z.string().trim().min(2).max(191),
  authority: optStr(191),
  description: optStr(10000),
  status: z.enum(COMPLIANCE_STATUSES).optional(),
  riskLevel: z.enum(COMPLIANCE_RISK_LEVELS).optional(),
  completion: z.coerce.number().int().min(0).max(100).optional(),
  assignedToId: optStr(40),
  dueDate: optionalDate,
  expiryDate: optionalDate,
  notes: optStr(5000),
});

export const createRequirementSchema = baseRequirement;

export const updateRequirementSchema = baseRequirement.partial();

export const listRequirementsQuerySchema = z.object({
  search: z.string().trim().max(191).optional(),
  status: z.enum(COMPLIANCE_STATUSES).optional(),
  region: z.string().trim().max(191).optional(),
  authority: z.string().trim().max(191).optional(),
  riskLevel: z.enum(COMPLIANCE_RISK_LEVELS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum([
    "title",
    "region",
    "status",
    "riskLevel",
    "dueDate",
    "expiryDate",
    "createdAt",
    "updatedAt",
  ]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const attachDocumentSchema = z.object({
  fileId: z.string().min(1).max(40),
  expiryDate: optionalDate,
  notes: optStr(2000),
});

export const updateDocumentSchema = z.object({
  status: z.enum(DOCUMENT_STATUSES).optional(),
  expiryDate: optionalDate,
  notes: optStr(2000),
});

export const documentIdSchema = z.object({
  id: z.string().min(1),
  documentId: z.string().min(1),
});