import prisma from "../config/prisma.js";

const include = { _count: { select: { stockLevels: true } } };

export const warehouseRepository = {
  list: (companyId) =>
    prisma.warehouse.findMany({ where: { companyId }, include, orderBy: { name: "asc" } }),
  findById: (companyId, id) => prisma.warehouse.findFirst({ where: { id, companyId }, include }),
  create: (data) => prisma.warehouse.create({ data, include }),
  update: (id, data) => prisma.warehouse.update({ where: { id }, data, include }),
  remove: (id) => prisma.warehouse.delete({ where: { id } }),
};