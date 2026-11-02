import { inventoryRepository as repo } from "../repositories/inventory.repository.js";
import { HttpError } from "./product.service.js";

const num = (v) => (v === null || v === undefined ? null : Number(v));
const round3 = (n) => Math.round(n * 1000) / 1000;

const toDto = (l) => {
  const quantity = Number(l.quantity);
  const capacity = num(l.capacity);
  const reorderLevel = num(l.reorderLevel);
  const capacityPercent =
    capacity && capacity > 0 ? Math.min(100, Math.round((quantity / capacity) * 100)) : null;
  // Low stock: at/below the reorder level, or (if none set) under 15% of capacity.
  const isLowStock =
    reorderLevel !== null
      ? quantity <= reorderLevel
      : capacityPercent !== null && capacityPercent < 15;

  return {
    id: l.id,
    warehouseId: l.warehouseId,
    warehouse: l.warehouse,
    productId: l.productId,
    product: l.product,
    quantity,
    unit: l.unit,
    capacity,
    reorderLevel,
    capacityPercent,
    isLowStock,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  };
};

const movementDto = (m) => ({
  id: m.id,
  type: m.type,
  quantityChange: Number(m.quantityChange),
  balanceAfter: Number(m.balanceAfter),
  reference: m.reference,
  note: m.note,
  createdAt: m.createdAt,
  createdBy: m.createdBy ? { id: m.createdBy.id, name: `${m.createdBy.firstName} ${m.createdBy.lastName}` } : null,
});

function buildWhere(companyId, { search, warehouseId, productId }) {
  const where = { companyId };
  if (warehouseId) where.warehouseId = warehouseId;
  if (productId) where.productId = productId;
  if (search) {
    where.OR = [
      { product: { name: { contains: search } } },
      { warehouse: { name: { contains: search } } },
    ];
  }
  return where;
}

async function getOrFail(companyId, id) {
  const level = await repo.findById(companyId, id);
  if (!level) throw new HttpError(404, "Stock item not found");
  return level;
}

export const inventoryService = {
  async list(companyId, query) {
    const { page, limit, sortBy, sortOrder } = query;
    const orderBy = sortBy === "productName" ? { product: { name: sortOrder } } : { [sortBy]: sortOrder };
    const { items, total } = await repo.list({
      where: buildWhere(companyId, query),
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
    });
    return {
      data: items.map(toDto),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  },

  async get(companyId, id) {
    return toDto(await getOrFail(companyId, id));
  },

  async create(companyId, userId, input) {
    const [warehouse, product] = await Promise.all([
      repo.findWarehouse(companyId, input.warehouseId),
      repo.findProduct(companyId, input.productId),
    ]);
    if (!warehouse) throw new HttpError(400, "Selected warehouse was not found");
    if (!warehouse.isActive) throw new HttpError(400, "This warehouse is inactive");
    if (!product) throw new HttpError(400, "Selected product was not found");

    const level = await repo.createWithOpening({
      companyId,
      userId,
      warehouseId: input.warehouseId,
      productId: input.productId,
      unit: input.unit || product.unit || "ton",
      capacity: input.capacity,
      reorderLevel: input.reorderLevel,
      openingQuantity: round3(input.quantity ?? 0),
    });
    return toDto(level);
  },

  async update(companyId, id, input) {
    await getOrFail(companyId, id);
    return toDto(await repo.updateSettings(id, input));
  },

  async remove(companyId, id) {
    const level = await getOrFail(companyId, id);
    if (Number(level.quantity) !== 0) {
      throw new HttpError(409, "This item still holds stock. Issue or adjust it down to zero before deleting.");
    }
    await repo.remove(id);
  },

  async listMovements(companyId, id, { page, limit }) {
    await getOrFail(companyId, id);
    const { items, total } = await repo.listMovements({
      stockLevelId: id,
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: items.map(movementDto),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  },

  async recordMovement(companyId, userId, id, input) {
    const level = await getOrFail(companyId, id);
    const amount = round3(input.quantity);
    const change = input.type === "ISSUE" ? -Math.abs(amount) : amount;

    const updated = await repo.applyMovement({
      companyId,
      userId,
      stockLevelId: id,
      productId: level.productId,
      type: input.type,
      change,
      reference: input.reference,
      note: input.note,
    });
    if (!updated) {
      throw new HttpError(
        400,
        `Insufficient stock: only ${Number(level.quantity)} ${level.unit} available`
      );
    }
    return toDto(updated);
  },
};