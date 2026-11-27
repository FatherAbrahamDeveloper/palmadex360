import { z } from "zod";

export const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_ON_USER", "RESOLVED", "CLOSED"];
export const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
export const TICKET_CATEGORIES = ["GENERAL", "ORDER", "SHIPMENT", "DOCUMENT", "BILLING", "TECHNICAL", "ACCOUNT", "COMPLAINT"];
const optId = z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(40).nullable().optional());

export const createTicketSchema = z.object({
  subject: z.string().trim().min(4, "Give your ticket a short subject").max(191),
  description: z.string().trim().min(10, "Please describe the issue in a little more detail").max(10000),
  category: z.enum(TICKET_CATEGORIES).default("GENERAL"),
  priority: z.enum(TICKET_PRIORITIES).default("MEDIUM"),
  customerId: optId,
  exportOrderId: optId,
  assignedToId: optId,
});

export const updateTicketSchema = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  category: z.enum(TICKET_CATEGORIES).optional(),
  assignedToId: optId,
  resolution: z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(5000).nullable().optional()),
});

export const replySchema = z.object({
  body: z.string().trim().min(1, "Write a reply").max(10000),
  internal: z.boolean().optional().default(false),
});

export const listTicketsQuery = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum([...TICKET_STATUSES, "ACTIVE"]).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  category: z.enum(TICKET_CATEGORIES).optional(),
  assignedToId: z.string().max(40).optional(),
  scope: z.enum(["all", "mine"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
