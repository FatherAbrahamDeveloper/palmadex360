import prisma from "../config/prisma.js";

const listInclude = {
  orders: {
    include: { exportOrder: { select: { id: true, orderNumber: true, customerName: true } } },
  },
};

const detailInclude = {
  ...listInclude,
  events: {
    orderBy: { createdAt: "desc" },
    include: { changedBy: { select: { id: true, firstName: true, lastName: true } } },
  },
};

export const shipmentRepository = {
  async list({ where, skip, take, orderBy }) {
    const [items, total] = await prisma.$transaction([
      prisma.shipment.findMany({ where, include: listInclude, skip, take, orderBy }),
      prisma.shipment.count({ where }),
    ]);
    return { items, total };
  },

  findById: (companyId, id) =>
    prisma.shipment.findFirst({ where: { id, companyId }, include: detailInclude }),
  create: (data) => prisma.shipment.create({ data, include: detailInclude }),
  update: (id, data) => prisma.shipment.update({ where: { id }, data, include: detailInclude }),
  remove: (id) => prisma.shipment.delete({ where: { id } }),

  findLastShipmentNumber: (companyId, prefix) =>
    prisma.shipment.findFirst({
      where: { companyId, shipmentNumber: { startsWith: prefix } },
      orderBy: { shipmentNumber: "desc" },
      select: { shipmentNumber: true },
    }),

  findOrderIdsInCompany: (companyId, ids) =>
    prisma.exportOrder.findMany({
      where: { companyId, id: { in: ids } },
      select: { id: true },
    }),
};