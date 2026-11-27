import { shipmentRepository as repo } from "../repositories/shipment.repository.js";
import { shipmentStatusChanged } from "./customerNotify.service.js";
import { HttpError } from "./product.service.js";
import { blockingFailures, blockedMessage } from "./qa.service.js";

// Statuses that mean the goods are being loaded or have left: a failed quality check blocks them.
const LOADING_OR_LATER = ["LOADING", "AT_SEA", "CUSTOMS", "ARRIVED"];

const toDto = (s) => ({
  id: s.id,
  shipmentNumber: s.shipmentNumber,
  vesselName: s.vesselName,
  voyageNumber: s.voyageNumber,
  shippingLine: s.shippingLine,
  bookingNumber: s.bookingNumber,
  billOfLadingNumber: s.billOfLadingNumber,
  originPort: s.originPort,
  destinationPort: s.destinationPort,
  etd: s.etd,
  eta: s.eta,
  containerCount: s.containerCount,
  status: s.status,
  notes: s.notes,
  orders: (s.orders || []).map((link) => link.exportOrder),
  ...(s.events && {
    events: s.events.map((e) => ({
      id: e.id,
      fromStatus: e.fromStatus,
      toStatus: e.toStatus,
      note: e.note,
      createdAt: e.createdAt,
      changedBy: e.changedBy
        ? { id: e.changedBy.id, name: `${e.changedBy.firstName} ${e.changedBy.lastName}` }
        : null,
    })),
  }),
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});

async function generateShipmentNumber(companyId) {
  const prefix = `SHP-${new Date().getFullYear()}-`;
  const last = await repo.findLastShipmentNumber(companyId, prefix);
  const next = last ? parseInt(last.shipmentNumber.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(Number.isNaN(next) ? 1 : next).padStart(4, "0")}`;
}

function buildWhere(companyId, { search, status, exportOrderId }) {
  const where = { companyId };
  if (status) where.status = status;
  if (exportOrderId) where.orders = { some: { exportOrderId } };
  if (search) {
    where.OR = [
      { shipmentNumber: { contains: search, mode: "insensitive" } },
      { vesselName: { contains: search, mode: "insensitive" } },
      { originPort: { contains: search, mode: "insensitive" } },
      { destinationPort: { contains: search, mode: "insensitive" } },
      { bookingNumber: { contains: search, mode: "insensitive" } },
      { billOfLadingNumber: { contains: search, mode: "insensitive" } },
    ];
  }
  return where;
}

function assertDates(etd, eta) {
  if (etd && eta && new Date(eta) < new Date(etd)) {
    throw new HttpError(400, "ETA cannot be earlier than ETD");
  }
}

// Confirms every selected order belongs to this company; returns de-duplicated ids.
async function resolveOrderIds(companyId, orderIds) {
  const unique = [...new Set(orderIds || [])];
  if (unique.length === 0) return unique;
  const found = await repo.findOrderIdsInCompany(companyId, unique);
  if (found.length !== unique.length) {
    throw new HttpError(400, "One or more selected export orders were not found");
  }
  return unique;
}

export const shipmentService = {
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
    const shipment = await repo.findById(companyId, id);
    if (!shipment) throw new HttpError(404, "Shipment not found");
    return toDto(shipment);
  },

  async create(companyId, userId, input) {
    const { orderIds, ...fields } = input;
    assertDates(fields.etd, fields.eta);
    const ids = await resolveOrderIds(companyId, orderIds);
    const status = fields.status || "BOOKED";

    // Retry if two shipments are created at the same moment and collide on shipmentNumber.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const shipmentNumber = await generateShipmentNumber(companyId);
        const created = await repo.create({
          ...fields,
          status,
          companyId,
          createdById: userId,
          shipmentNumber,
          orders: { create: ids.map((exportOrderId) => ({ exportOrderId })) },
          events: { create: { toStatus: status, changedById: userId } },
        });
        return toDto(created);
      } catch (err) {
        if (err?.code === "P2002" && attempt < 2) continue;
        throw err;
      }
    }
  },

  async update(companyId, userId, id, input) {
    const existing = await repo.findById(companyId, id);
    if (!existing) throw new HttpError(404, "Shipment not found");

    const { orderIds, ...fields } = input;
    assertDates(
      fields.etd !== undefined ? fields.etd : existing.etd,
      fields.eta !== undefined ? fields.eta : existing.eta
    );

    const data = { ...fields };

    if (orderIds) {
      const ids = await resolveOrderIds(companyId, orderIds);
      data.orders = { deleteMany: {}, create: ids.map((exportOrderId) => ({ exportOrderId })) };
    }

    if (fields.status && fields.status !== existing.status && LOADING_OR_LATER.includes(fields.status)) {
      const failures = await blockingFailures(companyId, { shipmentId: id });
      if (failures.length) throw new HttpError(409, blockedMessage(failures, `Moving this shipment to ${fields.status.replace("_", " ").toLowerCase()}`));
    }

    if (fields.status && fields.status !== existing.status) {
      data.events = {
        create: { fromStatus: existing.status, toStatus: fields.status, changedById: userId },
      };
    }

    const updated = await repo.update(id, data);
    if (fields.status && fields.status !== existing.status) {
      shipmentStatusChanged(companyId, id, existing.status, fields.status).catch((e) => console.error("NOTIFY ERROR:", e.message));
    }
    return toDto(updated);
  },

  async remove(companyId, id) {
    const existing = await repo.findById(companyId, id);
    if (!existing) throw new HttpError(404, "Shipment not found");
    await repo.remove(id);
  },
};