import { z } from "zod";

export const createConversationSchema = z.object({
  type: z.enum(["DIRECT", "GROUP", "COMPANY"]).default("DIRECT"),
  userIds: z.array(z.string().max(40)).max(50).default([]),
  title: z.preprocess((v) => (v === "" ? undefined : v), z.string().trim().max(120).optional()),
  message: z.preprocess((v) => (v === "" ? undefined : v), z.string().trim().max(5000).optional()),
});
export const sendMessageSchema = z.object({
  content: z.string().max(5000, "Message is too long").optional().default(""),
  fileIds: z.array(z.string().max(40)).max(10).optional().default([]),
});
export const editMessageSchema = z.object({ content: z.string().trim().min(1, "Message cannot be empty").max(5000) });
export const renameSchema = z.object({ title: z.string().trim().min(1).max(120) });
export const addMembersSchema = z.object({ userIds: z.array(z.string().max(40)).min(1).max(50) });
