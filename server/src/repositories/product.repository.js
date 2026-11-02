import prisma from "../config/prisma.js"; // adjust to wherever your PrismaClient instance lives

const include = { category: { select: { id: true, name: true, slug: true } } };

export const productRepository = {
  async list({ where, skip, take, orderBy }) {
    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({ where, include, skip, take, orderBy }),
      prisma.product.count({ where }),
    ]);
    return { items, total };
  },

  findById: (companyId, id) => prisma.product.findFirst({ where: { id, companyId }, include }),
  create: (data) => prisma.product.create({ data, include }),
  update: (id, data) => prisma.product.update({ where: { id }, data, include }),
  remove: (id) => prisma.product.delete({ where: { id } }),
  listCategories: () => prisma.productCategory.findMany({ orderBy: { name: "asc" } }),

  findSkusByPrefix: (companyId, prefix) =>
    prisma.product.findMany({
      where: { companyId, sku: { startsWith: `${prefix}-` } },
      select: { sku: true },
    }),
};
