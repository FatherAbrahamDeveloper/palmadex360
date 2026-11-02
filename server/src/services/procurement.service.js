import { procurementRepository as repo } from "../repositories/procurement.repository.js";
import { HttpError } from "./product.service.js";

const TRANSITIONS = {
  PENDING: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

const APPROVER_ROLES = ["SUPER_ADMIN", "ADMIN", "EXPORT_MANAGER"];
const DELETABLE = ["PENDING", "REJECTED", "CANCELLED"];

const num = (v) => (v === null || v === undefined ? null : Number(v));

const toDto = (r) => ({
  id: r.id,
  requestNumber: r.requestNumber,
  itemName: r.itemName,
  quantity: num(r.quantity),
  unit: r.unit,
  estimatedCost: num(r.estimatedCost),
  currency: r.currency,
  supplierId: r.supplierId,
  supplier: r.supplier || null,
  supplierName: r.supplierName,
  requiredByDate: r.requiredByDate,
  notes: r.notes,
  status: r.status,
  allowedStatuses: TRANSITIONS[r.status] || [],
  canEdit: r.status === "PENDING",
  canDelete: DELETABLE.includes(r.status),
  ...(r.events && {
    events: r.events.map((e) => ({
      id: e.id,
      fromStatus: e.fromStatus,
      toStatus: e.toStatus,
      note: e.note,
      createdAt: e.createdAt,
      changedBy: e.changedBy ? { id: e.changedBy.id, name: `${e.changedBy.firstName} ${e.changedBy.lastName}` } : null,
    })),
  }),
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

async function generateRequestNumber(companyId) {
  const prefix = `PR-${new Date().getFullYear()}-`;
  const last = await repo.findLastRequestNumber(companyId, prefix);
  const next = last ? parseInt(last.requestNumber.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(Number.isNaN(next) ? 1 : next).padStart(4, "0")}`;
}

function buildWhere(companyId, { search, status }) {
  const where = { companyId };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { requestNumber: { contains: search } },
      { itemName: { contains: search } },
      { supplierName: { contains: search } },
    ];
  }
  return where;
}

async function resolveSupplier(companyId, data) {
  if (data.supplierId) {
    const supplier = await repo.findSupplier(companyId, data.supplierId);
    if (!supplier) throw new HttpError(400, "Selected supplier was not found");
    data.supplierName = supplier.companyName;
  }
  return data;
}

async function getOrFail(companyId, id) {
  const request = await repo.findById(companyId, id);
  if (!request) throw new HttpError(404, "Purchase request not found");
  return request;
}

export const procurementService = {
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
    return toDto(await getOrFail(companyId, id));
  },

  supplierOptions: async (companyId) => ({ data: await repo.listSupplierOptions(companyId) }),

  async create(companyId, userId, input) {
    const data = await resolveSupplier(companyId, { ...input });

    // Retry if two requests are created at the same moment and collide on requestNumber.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const requestNumber = await generateRequestNumber(companyId);
        const created = await repo.create({
          ...data,
          companyId,
          createdById: userId,
          requestNumber,
          status: "PENDING",
          events: { create: { toStatus: "PENDING", changedById: userId } },
        });
        return toDto(created);
      } catch (err) {
        if (err?.code === "P2002" && attempt < 2) continue;
        throw err;
      }
    }
  },

  async update(companyId, id, input) {
    const existing = await getOrFail(companyId, id);
    if (existing.status !== "PENDING") {
      throw new HttpError(409, "Only pending requests can be edited");
    }
    const data = await resolveSupplier(companyId, { ...input });
    return toDto(await repo.update(id, data));
  },

  async changeStatus(companyId, userId, role, id, { status, note }) {
    const existing = await getOrFail(companyId, id);

    if (!TRANSITIONS[existing.status].includes(status)) {
      throw new HttpError(409, `A ${existing.status.toLowerCase().replace("_", " ")} request cannot be moved to ${status.toLowerCase().replace("_", " ")}`);
    }
    if (["APPROVED", "REJECTED"].includes(status) && !APPROVER_ROLES.includes(role)) {
      throw new HttpError(403, "Only managers can approve or reject purchase requests");
    }

    const updated = await repo.changeStatus({
      id, companyId, from: existing.status, to: status, userId, note,
    });
    if (!updated) {
      throw new HttpError(409, "This request was just updated by someone else. Refresh and try again.");
    }
    return toDto(updated);
  },

  async remove(companyId, id) {
    const existing = await getOrFail(companyId, id);
    if (!DELETABLE.includes(existing.status)) {
      throw new HttpError(409, "Only pending, rejected or cancelled requests can be deleted");
    }
    await repo.remove(id);
  },
};