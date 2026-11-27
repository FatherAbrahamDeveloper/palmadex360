import { z } from "zod";

const opt = (max) => z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(max).nullable().optional());

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Category name is required").max(100),
  description: opt(1000),
  sortOrder: z.coerce.number().int().min(0).max(1000).optional(),
});

export const articleSchema = z.object({
  title: z.string().trim().min(3, "Title is required").max(191),
  categoryId: opt(40),
  type: z.enum(["ARTICLE", "FAQ", "GUIDE", "TUTORIAL"]).default("ARTICLE"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  audience: z.enum(["INTERNAL", "ALL"]).default("ALL"),
  summary: opt(1000),
  body: z.string().trim().min(10, "Write the article content").max(200_000),
  tags: opt(500),
});
export const updateArticleSchema = articleSchema.partial();

export const listArticlesQuery = z.object({
  q: z.string().trim().max(100).optional(),
  categoryId: z.string().max(40).optional(),
  type: z.enum(["ARTICLE", "FAQ", "GUIDE", "TUTORIAL"]).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  sort: z.enum(["recent", "popular", "title"]).default("recent"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const feedbackSchema = z.object({ helpful: z.boolean() });
