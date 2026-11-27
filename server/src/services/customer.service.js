import prisma from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";

const ACTIVE_ORDER = ["PENDING", "PROCESSING", "IN_TRANSIT"];

async function checkContact(companyId, contactId) {
  if (!contactId) return;
  const c = await prisma.cRMContact.findFirst({ where: { id: contactId, companyId } });
  if (!c) throw new HttpError(400, "Selected CRM contact was not found");
}

export const customerService = {
  async list(companyId, { q, active, page, limit }) {
    const where = { companyId };
    if (active) where.isActive = active === "true";
    if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q, mode: "insensitive" } }, { country: { contains: q, mode: "insensitive" } }];
    const [items, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { name: "asc" },
        include: { _count: { select: { orders: true, users: true, tickets: true } }, contact: { select: { id: true, displayName: true } } },
      }),
      prisma.customer.count({ where }),
    ]);
    return { data: items, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  },

  options: (companyId) =>
    prisma.customer.findMany({ where: { companyId, isActive: true }, select: { id: true, name: true, country: true }, orderBy: { name: "asc" } }),

  async get(companyId, id) {
    const customer = await prisma.customer.findFirst({
      where: { id, companyId },
      include: {
        contact: { select: { id: true, displayName: true } },
        users: { select: { id: true, firstName: true, lastName: true, email: true, isActive: true, approvalStatus: true } },
        _count: { select: { orders: true, files: true, tickets: true } },
      },
    });
    if (!customer) throw new HttpError(404, "Customer not found");
    const [activeOrders, totals] = await Promise.all([
      prisma.exportOrder.count({ where: { companyId, customerId: id, status: { in: ACTIVE_ORDER } } }),
      prisma.exportOrder.groupBy({ by: ["currency"], where: { companyId, customerId: id, status: { not: "CANCELLED" } }, _sum: { totalValue: true } }),
    ]);
    return { ...customer, activeOrders, orderValue: totals.map((t) => ({ currency: t.currency, total: Number(t._sum.totalValue || 0) })) };
  },

  async create(companyId, input) {
    await checkContact(companyId, input.contactId);
    return prisma.customer.create({ data: { ...input, companyId } });
  },

  async update(companyId, id, input) {
    const existing = await prisma.customer.findFirst({ where: { id, companyId } });
    if (!existing) throw new HttpError(404, "Customer not found");
    await checkContact(companyId, input.contactId);
    return prisma.customer.update({ where: { id }, data: input });
  },

  async remove(companyId, id) {
    const existing = await prisma.customer.findFirst({ where: { id, companyId }, include: { _count: { select: { orders: true, users: true } } } });
    if (!existing) throw new HttpError(404, "Customer not found");
    if (existing._count.orders || existing._count.users) {
      throw new HttpError(400, "This customer has orders or portal users. Mark it inactive instead of deleting it.");
    }
    await prisma.customer.delete({ where: { id } });
  },
};
