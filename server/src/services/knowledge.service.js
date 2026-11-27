import prisma from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { permissionService } from "./permission.service.js";

const slugify = (s) =>
  String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "item";

async function uniqueSlug(model, companyId, base, excludeId) {
  let slug = slugify(base);
  for (let i = 2; ; i++) {
    const clash = await prisma[model].findFirst({ where: { companyId, slug, ...(excludeId ? { id: { not: excludeId } } : {}) } });
    if (!clash) return slug;
    slug = `${slugify(base).slice(0, 95)}-${i}`;
  }
}

const canEdit = (user) => user.role !== "CUSTOMER" && permissionService.can(user, "knowledge", "EDIT");

// Readers only ever see published articles; customers only see articles meant for everyone.
async function readerWhere(user) {
  const editor = await canEdit(user);
  const where = { companyId: user.companyId };
  if (!editor) where.status = "PUBLISHED";
  if (user.role === "CUSTOMER") where.audience = "ALL";
  return { where, editor };
}

const author = (a) => (a ? { id: a.id, name: `${a.firstName} ${a.lastName}`.trim() } : null);
const articleDto = (a, full = false) => ({
  id: a.id, title: a.title, slug: a.slug, type: a.type, status: a.status, audience: a.audience,
  summary: a.summary, tags: a.tags ? a.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
  category: a.category ? { id: a.category.id, name: a.category.name, slug: a.category.slug } : null,
  author: author(a.author), viewCount: a.viewCount, helpfulYes: a.helpfulYes, helpfulNo: a.helpfulNo,
  publishedAt: a.publishedAt, createdAt: a.createdAt, updatedAt: a.updatedAt,
  ...(full ? { body: a.body } : {}),
});
const include = { category: true, author: { select: { id: true, firstName: true, lastName: true } } };

export const knowledgeService = {
  async categories(user) {
    const { where } = await readerWhere(user);
    const cats = await prisma.knowledgeCategory.findMany({
      where: { companyId: user.companyId },
      include: { _count: { select: { articles: { where } } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description, sortOrder: c.sortOrder, articleCount: c._count.articles }));
  },

  async createCategory(user, input) {
    return prisma.knowledgeCategory.create({
      data: { ...input, companyId: user.companyId, slug: await uniqueSlug("knowledgeCategory", user.companyId, input.name) },
    });
  },

  async updateCategory(user, id, input) {
    const c = await prisma.knowledgeCategory.findFirst({ where: { id, companyId: user.companyId } });
    if (!c) throw new HttpError(404, "Category not found");
    const data = { ...input };
    if (input.name && input.name !== c.name) data.slug = await uniqueSlug("knowledgeCategory", user.companyId, input.name, id);
    return prisma.knowledgeCategory.update({ where: { id }, data });
  },

  async removeCategory(user, id) {
    const c = await prisma.knowledgeCategory.findFirst({ where: { id, companyId: user.companyId } });
    if (!c) throw new HttpError(404, "Category not found");
    await prisma.knowledgeCategory.delete({ where: { id } }); // articles keep existing, uncategorised
  },

  async list(user, { q, categoryId, type, status, sort, page, limit }) {
    const { where, editor } = await readerWhere(user);
    if (categoryId) where.categoryId = categoryId === "none" ? null : categoryId;
    if (type) where.type = type;
    if (status && editor) where.status = status;
    if (q) {
      const words = q.split(/\s+/).filter(Boolean).slice(0, 6);
      where.AND = words.map((w) => ({ OR: [{ title: { contains: w, mode: "insensitive" } }, { summary: { contains: w, mode: "insensitive" } }, { tags: { contains: w, mode: "insensitive" } }, { body: { contains: w, mode: "insensitive" } }] }));
    }
    const orderBy = sort === "popular" ? [{ viewCount: "desc" }] : sort === "title" ? [{ title: "asc" }] : [{ updatedAt: "desc" }];
    const [items, total] = await prisma.$transaction([
      prisma.knowledgeArticle.findMany({ where, include, orderBy, skip: (page - 1) * limit, take: limit }),
      prisma.knowledgeArticle.count({ where }),
    ]);
    return { data: items.map((a) => articleDto(a)), meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), canEdit: editor } };
  },

  async get(user, idOrSlug, { countView = true } = {}) {
    const { where, editor } = await readerWhere(user);
    const article = await prisma.knowledgeArticle.findFirst({ where: { ...where, OR: [{ id: idOrSlug }, { slug: idOrSlug }] }, include });
    if (!article) throw new HttpError(404, "Article not found");
    if (countView && article.status === "PUBLISHED") {
      await prisma.knowledgeArticle.update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } });
      article.viewCount += 1;
    }
    const related = await prisma.knowledgeArticle.findMany({
      where: { ...where, id: { not: article.id }, ...(article.categoryId ? { categoryId: article.categoryId } : {}) },
      select: { id: true, title: true, slug: true, type: true },
      orderBy: { viewCount: "desc" }, take: 5,
    });
    return { ...articleDto(article, true), related, canEdit: editor };
  },

  async create(user, input) {
    if (input.categoryId && !(await prisma.knowledgeCategory.findFirst({ where: { id: input.categoryId, companyId: user.companyId } }))) {
      throw new HttpError(400, "Selected category was not found");
    }
    const a = await prisma.knowledgeArticle.create({
      data: {
        ...input, companyId: user.companyId, authorId: user.id,
        slug: await uniqueSlug("knowledgeArticle", user.companyId, input.title),
        publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      },
      include,
    });
    return articleDto(a, true);
  },

  async update(user, id, input) {
    const existing = await prisma.knowledgeArticle.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) throw new HttpError(404, "Article not found");
    if (input.categoryId && !(await prisma.knowledgeCategory.findFirst({ where: { id: input.categoryId, companyId: user.companyId } }))) {
      throw new HttpError(400, "Selected category was not found");
    }
    const data = { ...input };
    if (input.title && input.title !== existing.title) data.slug = await uniqueSlug("knowledgeArticle", user.companyId, input.title, id);
    if (input.status === "PUBLISHED" && !existing.publishedAt) data.publishedAt = new Date();
    const a = await prisma.knowledgeArticle.update({ where: { id }, data, include });
    return articleDto(a, true);
  },

  async remove(user, id) {
    const existing = await prisma.knowledgeArticle.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) throw new HttpError(404, "Article not found");
    await prisma.knowledgeArticle.delete({ where: { id } });
  },

  async feedback(user, id, helpful) {
    const { where } = await readerWhere(user);
    const a = await prisma.knowledgeArticle.findFirst({ where: { ...where, id } });
    if (!a) throw new HttpError(404, "Article not found");
    const updated = await prisma.knowledgeArticle.update({
      where: { id }, data: helpful ? { helpfulYes: { increment: 1 } } : { helpfulNo: { increment: 1 } },
    });
    return { helpfulYes: updated.helpfulYes, helpfulNo: updated.helpfulNo };
  },
};
