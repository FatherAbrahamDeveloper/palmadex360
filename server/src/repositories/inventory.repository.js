import prisma from "../config/prisma.js";

const include = {
  product: { select: { id: true, name: true, sku: true, unit: true } },
  warehouse: { select: { id: true, name: true, code: true } },
};

// Keeps Product.stockQuantity equal to the total across all warehouses.
async function syncProductStock(tx, productId) {
  const agg = await tx.stockLevel.aggregate({ where: { productId }, _sum: { quantity: true } });
  await tx.product.update({
    where: { id: productId },
    data: { stockQuantity: agg._sum.quantity ?? 0 },
  });
}

export const inventoryRepository = {
  async list({ where, skip, take, orderBy }) {
    const [items, total] = await prisma.$transaction([
      prisma.stockLevel.findMany({ where, include, skip, take, orderBy }),
      prisma.stockLevel.count({ where }),
    ]);
    return { items, total };
  },

  findById: (companyId, id) => prisma.stockLevel.findFirst({ where: { id, companyId }, include }),
  updateSettings: (id, data) => prisma.stockLevel.update({ where: { id }, data, include }),
  remove: (id) => prisma.stockLevel.delete({ where: { id } }),

  findWarehouse: (companyId, id) => prisma.warehouse.findFirst({ where: { id, companyId } }),
  findProduct: (companyId, id) => prisma.product.findFirst({ where: { id, companyId } }),

  async listMovements({ stockLevelId, skip, take }) {
    const [items, total] = await prisma.$transaction([
      prisma.stockMovement.findMany({
        where: { stockLevelId },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.stockMovement.count({ where: { stockLevelId } }),
    ]);
    return { items, total };
  },

  createWithOpening({ companyId, userId, warehouseId, productId, unit, capacity, reorderLevel, openingQuantity }) {
    return prisma.$transaction(async (tx) => {
      const level = await tx.stockLevel.create({
        data: { companyId, warehouseId, productId, unit, capacity, reorderLevel, quantity: openingQuantity },
      });
      if (openingQuantity > 0) {
        await tx.stockMovement.create({
          data: {
            companyId,
            stockLevelId: level.id,
            type: "RECEIPT",
            quantityChange: openingQuantity,
            balanceAfter: openingQuantity,
            note: "Opening balance",
            createdById: userId,
          },
        });
        await syncProductStock(tx, productId);
      }
      return tx.stockLevel.findUnique({ where: { id: level.id }, include });
    });
  },

  // Returns null when an outgoing movement would take the stock below zero.
  applyMovement({ companyId, userId, stockLevelId, productId, type, change, reference, note }) {
    return prisma.$transaction(async (tx) => {
      if (change < 0) {
        const amount = Math.abs(change);
        const res = await tx.stockLevel.updateMany({
          where: { id: stockLevelId, companyId, quantity: { gte: amount } },
          data: { quantity: { decrement: amount } },
        });
        if (res.count === 0) return null;
      } else {
        await tx.stockLevel.update({
          where: { id: stockLevelId },
          data: { quantity: { increment: change } },
        });
      }

      const level = await tx.stockLevel.findUnique({ where: { id: stockLevelId } });
      await tx.stockMovement.create({
        data: {
          companyId,
          stockLevelId,
          type,
          quantityChange: change,
          balanceAfter: level.quantity,
          reference,
          note,
          createdById: userId,
        },
      });
      await syncProductStock(tx, productId);
      return tx.stockLevel.findUnique({ where: { id: stockLevelId }, include });
    });
  },
};