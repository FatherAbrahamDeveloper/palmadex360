import { exportOrderRepository as repo } from "../repositories/exportOrder.repository.js";
import { HttpError } from "./product.service.js";
import { orderStatusChanged } from "./customerNotify.service.js";

const PROGRESS = { PENDING: 10, PROCESSING: 30, IN_TRANSIT: 65, DELIVERED: 100, CANCELLED: 0 };

const toDto = (o) => ({
  id: o.id,
  orderNumber: o.orderNumber,
  customerName: o.customerName,
  contactId: o.contactId,
  contact: o.contact || null,
  customerId: o.customerId,
  customer: o.customer || null,
  productId: o.productId,
  product: o.product || null,
  productName: o.productName,
  quantity: Number(o.quantity),
  unit: o.unit,
  totalValue: Number(o.totalValue),
  currency: o.currency,
  status: o.status,
  progress: PROGRESS[o.status] ?? 0,
  notes: o.notes,
  createdAt: o.createdAt,
  updatedAt: o.updatedAt,
});

async function generateOrderNumber(companyId) {
  const prefix = `EXP-${new Date().getFullYear()}-`;
  const last = await repo.findLastOrderNumber(companyId, prefix);
  const next = last ? parseInt(last.orderNumber.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(Number.isNaN(next) ? 1 : next).padStart(4, "0")}`;
}

function buildWhere(companyId, { search, status, customerId }) {
  const where = { companyId };
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { productName: { contains: search, mode: "insensitive" } },
    ];
  }
  return where;
}

// Verifies linked product/contact belong to the same company and fills the product snapshot.
async function resolveLinks(companyId, data) {
  if (data.productId) {
    const product = await repo.findProductById(companyId, data.productId);
    if (!product) throw new HttpError(400, "Selected product was not found");
    if (!data.productName) data.productName = product.name;
    if (!data.unit && product.unit) data.unit = product.unit;
  }
  if (data.customerId) {
    const customer = await repo.findCustomerById(companyId, data.customerId);
    if (!customer) throw new HttpError(400, "Selected customer was not found");
    if (!data.customerName) data.customerName = customer.name;
    if (!data.contactId && customer.contactId) data.contactId = customer.contactId;
  }
  if (data.contactId) {
    const contact = await repo.findContactById(companyId, data.contactId);
    if (!contact) throw new HttpError(400, "Selected contact was not found");
  }
  return data;
}

export const exportOrderService = {
  async list(companyId, query) {
    const { page, limit, sortBy, sortOrder } = query;
    const { items, total } = await repo.list({
      where: buildWhere(companyId, query),
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });
    return {
      data: items.map(toDto),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  },

  async get(companyId, id) {
    const order = await repo.findById(companyId, id);
    if (!order) throw new HttpError(404, "Export order not found");
    return toDto(order);
  },

  async create(companyId, userId, input) {
    const data = await resolveLinks(companyId, { ...input, companyId, createdById: userId });
    // Retry if two orders are created at the same moment and collide on orderNumber.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const orderNumber = await generateOrderNumber(companyId);
        return toDto(await repo.create({ ...data, orderNumber }));
      } catch (err) {
        if (err?.code === "P2002" && attempt < 2) continue;
        throw err;
      }
    }
  },

  async update(companyId, id, input) {
    const existing = await repo.findById(companyId, id);
    if (!existing) throw new HttpError(404, "Export order not found");
    const data = await resolveLinks(companyId, { ...input });
    const updated = await repo.update(id, data);
    orderStatusChanged(updated, existing.status)?.catch?.((e) => console.error("NOTIFY ERROR:", e.message));
    return toDto(updated);
  },

  async remove(companyId, id) {
    const existing = await repo.findById(companyId, id);
    if (!existing) throw new HttpError(404, "Export order not found");
    await repo.remove(id);
  },
};