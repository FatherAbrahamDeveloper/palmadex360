import prisma from "../config/prisma.js";

const include = {
  product: { select: { id: true, name: true } },
  contact: { select: { id: true, displayName: true } },
};

export const exportOrderRepository = {
  async list({ where, skip, take, orderBy }) {
    const [items, total] = await prisma.$transaction([
      prisma.exportOrder.findMany({ where, include, skip, take, orderBy }),
      prisma.exportOrder.count({ where }),
    ]);
    return { items, total };
  },

  findById: (companyId, id) => prisma.exportOrder.findFirst({ where: { id, companyId }, include }),
  create: (data) => prisma.exportOrder.create({ data, include }),
  update: (id, data) => prisma.exportOrder.update({ where: { id }, data, include }),
  remove: (id) => prisma.exportOrder.delete({ where: { id } }),

  findLastOrderNumber: (companyId, prefix) =>
    prisma.exportOrder.findFirst({
      where: { companyId, orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    }),

  findProductById: (companyId, id) => prisma.product.findFirst({ where: { id, companyId } }),
  findContactById: (companyId, id) => prisma.cRMContact.findFirst({ where: { id, companyId } }),
};