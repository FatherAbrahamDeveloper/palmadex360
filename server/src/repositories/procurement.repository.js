import prisma from "../config/prisma.js";

const listInclude = { supplier: { select: { id: true, companyName: true } } };

const detailInclude = {
  ...listInclude,
  events: {
    orderBy: { createdAt: "desc" },
    include: { changedBy: { select: { id: true, firstName: true, lastName: true } } },
  },
};

export const procurementRepository = {
  async list({ where, skip, take, orderBy }) {
    const [items, total] = await prisma.$transaction([
      prisma.purchaseRequest.findMany({ where, include: listInclude, skip, take, orderBy }),
      prisma.purchaseRequest.count({ where }),
    ]);
    return { items, total };
  },

  findById: (companyId, id) =>
    prisma.purchaseRequest.findFirst({ where: { id, companyId }, include: detailInclude }),
  create: (data) => prisma.purchaseRequest.create({ data, include: detailInclude }),
  update: (id, data) => prisma.purchaseRequest.update({ where: { id }, data, include: detailInclude }),
  remove: (id) => prisma.purchaseRequest.delete({ where: { id } }),

  findLastRequestNumber: (companyId, prefix) =>
    prisma.purchaseRequest.findFirst({
      where: { companyId, requestNumber: { startsWith: prefix } },
      orderBy: { requestNumber: "desc" },
      select: { requestNumber: true },
    }),

  findSupplier: (companyId, id) => prisma.supplier.findFirst({ where: { id, companyId } }),

  // Only verified suppliers are offered in the dropdown. Remove the status line to offer all.
  listSupplierOptions: (companyId) =>
    prisma.supplier.findMany({
      where: { companyId, status: "VERIFIED" },
      select: { id: true, companyName: true },
      orderBy: { companyName: "asc" },
      take: 200,
    }),

  // Moves the status only if it is still what the caller saw; returns null if someone else changed it first.
  changeStatus({ id, companyId, from, to, userId, note }) {
    return prisma.$transaction(async (tx) => {
      const res = await tx.purchaseRequest.updateMany({
        where: { id, companyId, status: from },
        data: { status: to },
      });
      if (res.count === 0) return null;
      await tx.purchaseRequestEvent.create({
        data: { purchaseRequestId: id, fromStatus: from, toStatus: to, changedById: userId, note },
      });
      return tx.purchaseRequest.findUnique({ where: { id }, include: detailInclude });
    });
  },
};