import prisma from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { notificationService } from "./notification.service.js";
import { activityService } from "./activity.service.js";
import { sendMail, appUrl } from "./mail.service.js";
import { toFileDto } from "../utils/fileUrl.js";

const ACTIVE_ORDER = ["PENDING", "PROCESSING", "IN_TRANSIT"];
const ACTIVE_SHIPMENT = ["BOOKED", "LOADING", "AT_SEA", "CUSTOMS"];
const SHIPMENT_STEPS = ["BOOKED", "LOADING", "AT_SEA", "CUSTOMS", "ARRIVED"];
const ORDER_PROGRESS = { PENDING: 10, PROCESSING: 30, IN_TRANSIT: 65, DELIVERED: 100, CANCELLED: 0 };

const num = (v) => (v == null ? null : Number(v));

// Customers see their own customer record; staff with portal access may preview any customer.
export async function resolvePortalCustomer(user, requestedId) {
  const id = user.role === "CUSTOMER" ? user.customerId : requestedId;
  if (!id) {
    throw new HttpError(user.role === "CUSTOMER" ? 403 : 400,
      user.role === "CUSTOMER"
        ? "Your account is not linked to a customer yet. Please contact Palmadex."
        : "Choose a customer to view their portal");
  }
  const customer = await prisma.customer.findFirst({ where: { id, companyId: user.companyId } });
  if (!customer) throw new HttpError(404, "Customer not found");
  if (user.role === "CUSTOMER" && !customer.isActive) throw new HttpError(403, "This customer account is inactive. Please contact Palmadex.");
  return customer;
}

const orderDto = (o) => ({
  id: o.id, orderNumber: o.orderNumber, productName: o.productName, productId: o.productId,
  quantity: num(o.quantity), unit: o.unit, totalValue: num(o.totalValue), currency: o.currency,
  status: o.status, progress: ORDER_PROGRESS[o.status] ?? 0, notes: o.notes,
  createdAt: o.createdAt, updatedAt: o.updatedAt,
});

const shipmentDto = (s) => ({
  id: s.id, shipmentNumber: s.shipmentNumber, vesselName: s.vesselName, voyageNumber: s.voyageNumber,
  shippingLine: s.shippingLine, billOfLadingNumber: s.billOfLadingNumber, bookingNumber: s.bookingNumber,
  originPort: s.originPort, destinationPort: s.destinationPort, etd: s.etd, eta: s.eta,
  containerCount: s.containerCount, status: s.status,
  step: s.status === "CANCELLED" ? -1 : SHIPMENT_STEPS.indexOf(s.status),
  steps: SHIPMENT_STEPS,
  events: (s.events || []).map((e) => ({ id: e.id, fromStatus: e.fromStatus, toStatus: e.toStatus, note: e.note, createdAt: e.createdAt })),
  orders: (s.orders || []).map((so) => ({ id: so.exportOrder.id, orderNumber: so.exportOrder.orderNumber })),
  updatedAt: s.updatedAt,
});

const invoiceDto = (i) => {
  const amount = Number(i.amount);
  const paid = Number(i.amountPaid);
  const overdue = i.status !== "PAID" && i.status !== "CANCELLED" && new Date(i.dueDate) < new Date();
  return {
    id: i.id, invoiceNumber: i.invoiceNumber, issueDate: i.issueDate, dueDate: i.dueDate, currency: i.currency,
    amount, amountPaid: paid, balance: Math.max(0, amount - paid), status: overdue ? "OVERDUE" : i.status,
    exportOrder: i.exportOrder ? { id: i.exportOrder.id, orderNumber: i.exportOrder.orderNumber } : null,
  };
};

const shipmentWhere = (companyId, customerId) => ({ companyId, orders: { some: { exportOrder: { customerId } } } });
const invoiceWhere = (companyId, customerId) => ({ companyId, exportOrder: { customerId } });
const fileWhere = (companyId, customerId) => ({ companyId, OR: [{ customerId }, { exportOrder: { customerId } }] });

export const portalService = {
  async summary(user, customer) {
    const { companyId } = user;
    const cid = customer.id;
    const [orders, activeOrders, activeShipments, documents, invoices, openTickets, recentOrders, nextShipment] = await Promise.all([
      prisma.exportOrder.count({ where: { companyId, customerId: cid } }),
      prisma.exportOrder.count({ where: { companyId, customerId: cid, status: { in: ACTIVE_ORDER } } }),
      prisma.shipment.count({ where: { ...shipmentWhere(companyId, cid), status: { in: ACTIVE_SHIPMENT } } }),
      prisma.file.count({ where: fileWhere(companyId, cid) }),
      prisma.invoice.findMany({ where: { ...invoiceWhere(companyId, cid), status: { notIn: ["PAID", "CANCELLED"] } }, select: { amount: true, amountPaid: true, currency: true, dueDate: true } }),
      prisma.supportTicket.count({ where: { companyId, customerId: cid, status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_USER"] } } }),
      prisma.exportOrder.findMany({ where: { companyId, customerId: cid }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.shipment.findFirst({ where: { ...shipmentWhere(companyId, cid), status: { in: ACTIVE_SHIPMENT } }, orderBy: { eta: "asc" }, include: { events: { orderBy: { createdAt: "desc" }, take: 5 }, orders: { include: { exportOrder: { select: { id: true, orderNumber: true } } } } } }),
    ]);
    const outstanding = {};
    let overdueCount = 0;
    for (const i of invoices) {
      outstanding[i.currency] = (outstanding[i.currency] || 0) + Number(i.amount) - Number(i.amountPaid);
      if (new Date(i.dueDate) < new Date()) overdueCount += 1;
    }
    return {
      customer: { id: customer.id, name: customer.name, country: customer.country, email: customer.email },
      counts: { orders, activeOrders, activeShipments, documents, unpaidInvoices: invoices.length, overdueInvoices: overdueCount, openTickets },
      outstanding: Object.entries(outstanding).map(([currency, total]) => ({ currency, total: Math.round(total * 100) / 100 })),
      recentOrders: recentOrders.map(orderDto),
      nextShipment: nextShipment ? shipmentDto(nextShipment) : null,
    };
  },

  catalog: (user, { q }) =>
    prisma.product
      .findMany({
        where: {
          companyId: user.companyId, isActive: true,
          ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { hsCode: { contains: q, mode: "insensitive" } }] } : {}),
        },
        select: {
          id: true, name: true, sku: true, description: true, unit: true, price: true, currency: true,
          minimumOrderQuantity: true, originCountry: true, hsCode: true, packaging: true, specifications: true,
          stockQuantity: true, isNewListing: true, category: { select: { id: true, name: true } },
        },
        orderBy: [{ isNewListing: "desc" }, { name: "asc" }],
        take: 200,
      })
      .then((items) => items.map((p) => ({
        ...p, price: num(p.price), minimumOrderQuantity: num(p.minimumOrderQuantity),
        inStock: Number(p.stockQuantity) > 0, stockQuantity: undefined,
      }))),

  async orders(user, customer, { status, page = 1, limit = 20 }) {
    const where = { companyId: user.companyId, customerId: customer.id, ...(status ? { status } : {}) };
    const [items, total] = await prisma.$transaction([
      prisma.exportOrder.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.exportOrder.count({ where }),
    ]);
    return { data: items.map(orderDto), meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  },

  async order(user, customer, id) {
    const order = await prisma.exportOrder.findFirst({
      where: { id, companyId: user.companyId, customerId: customer.id },
      include: {
        shipments: { include: { shipment: { include: { events: { orderBy: { createdAt: "asc" } }, orders: { include: { exportOrder: { select: { id: true, orderNumber: true } } } } } } } },
        invoices: { include: { exportOrder: { select: { id: true, orderNumber: true } } } },
        files: { select: { id: true, originalName: true, mimeType: true, size: true, createdAt: true } },
      },
    });
    if (!order) throw new HttpError(404, "Order not found");
    return {
      ...orderDto(order),
      shipments: order.shipments.map((so) => shipmentDto(so.shipment)),
      invoices: order.invoices.map(invoiceDto),
      documents: order.files.map((f) => toFileDto(f, user.id)),
    };
  },

  // A buyer places an order request. Staff then confirm pricing and move it to PROCESSING.
  async placeOrder(user, customer, input) {
    if (user.role !== "CUSTOMER") throw new HttpError(403, "Only customer accounts place orders from the portal");
    const product = await prisma.product.findFirst({ where: { id: input.productId, companyId: user.companyId, isActive: true } });
    if (!product) throw new HttpError(400, "This product is not available");
    if (product.minimumOrderQuantity && input.quantity < Number(product.minimumOrderQuantity)) {
      throw new HttpError(400, `The minimum order for ${product.name} is ${Number(product.minimumOrderQuantity)} ${product.unit || ""}`.trim());
    }

    const price = product.price ? Number(product.price) : 0;
    const notes = [
      `Destination: ${input.destination}`,
      input.requestedDeliveryDate ? `Requested delivery: ${input.requestedDeliveryDate.toISOString().slice(0, 10)}` : null,
      input.notes ? `Customer notes: ${input.notes}` : null,
      price ? null : "Price to be confirmed by Palmadex.",
    ].filter(Boolean).join("\n");

    const prefix = `EXP-${new Date().getFullYear()}-`;
    let order;
    for (let attempt = 0; attempt < 3 && !order; attempt++) {
      const last = await prisma.exportOrder.findFirst({ where: { companyId: user.companyId, orderNumber: { startsWith: prefix } }, orderBy: { orderNumber: "desc" }, select: { orderNumber: true } });
      const next = last ? parseInt(last.orderNumber.slice(prefix.length), 10) + 1 : 1;
      try {
        order = await prisma.exportOrder.create({
          data: {
            companyId: user.companyId, customerId: customer.id, contactId: customer.contactId || null,
            orderNumber: `${prefix}${String(Number.isNaN(next) ? 1 : next).padStart(4, "0")}`,
            customerName: customer.name, productId: product.id, productName: product.name,
            quantity: input.quantity, unit: input.unit || product.unit || "ton",
            totalValue: Math.round(price * input.quantity * 100) / 100, currency: product.currency || "USD",
            status: "PENDING", notes, createdById: user.id,
          },
        });
      } catch (err) {
        if (err?.code !== "P2002" || attempt === 2) throw err;
      }
    }

    activityService.record({
      companyId: user.companyId, userId: user.id, action: "placed", entity: "ExportOrder", entityId: order.id,
      summary: `placed export order ${order.orderNumber} for ${product.name}`, link: "/orders",
    });
    const staff = await notificationService.usersWithAccess(user.companyId, "orders", "EDIT");
    await notificationService.notifyMany(staff.map((s) => s.id), {
      companyId: user.companyId, title: `New portal order ${order.orderNumber}`,
      message: `${customer.name} ordered ${input.quantity} ${order.unit} of ${product.name} to ${input.destination}.`,
      type: "order.portal", link: "/orders",
    });
    for (const s of staff) {
      sendMail({
        to: s.email, subject: `New portal order ${order.orderNumber} from ${customer.name}`,
        heading: "A customer placed an order",
        paragraphs: [`${customer.name} ordered ${input.quantity} ${order.unit} of ${product.name}.`, `Destination: ${input.destination}.`],
        action: { label: "Open export orders", url: appUrl("/orders") },
      });
    }
    sendMail({
      to: user.email, subject: `We received your order ${order.orderNumber}`,
      heading: "Thank you for your order",
      paragraphs: [
        `Your order ${order.orderNumber} for ${input.quantity} ${order.unit} of ${product.name} has been received.`,
        "Our team will confirm pricing, documents and shipping details shortly. You can follow progress in the Customer Portal.",
      ],
      action: { label: "View my orders", url: appUrl("/portal") },
    });
    return orderDto(order);
  },

  async cancelOrder(user, customer, id) {
    const order = await prisma.exportOrder.findFirst({ where: { id, companyId: user.companyId, customerId: customer.id } });
    if (!order) throw new HttpError(404, "Order not found");
    if (order.status !== "PENDING") throw new HttpError(400, "Only orders that are still pending can be cancelled. Please contact Palmadex.");
    const updated = await prisma.exportOrder.update({ where: { id }, data: { status: "CANCELLED" } });
    activityService.record({ companyId: user.companyId, userId: user.id, action: "cancelled", entity: "ExportOrder", entityId: id, summary: `cancelled export order ${order.orderNumber}` });
    const staff = await notificationService.usersWithAccess(user.companyId, "orders", "EDIT");
    await notificationService.notifyMany(staff.map((s) => s.id), {
      companyId: user.companyId, title: `Order ${order.orderNumber} cancelled`,
      message: `${customer.name} cancelled order ${order.orderNumber}.`, type: "order.cancelled", link: "/orders",
    });
    return orderDto(updated);
  },

  async shipments(user, customer) {
    const items = await prisma.shipment.findMany({
      where: shipmentWhere(user.companyId, customer.id),
      include: { events: { orderBy: { createdAt: "asc" } }, orders: { where: { exportOrder: { customerId: customer.id } }, include: { exportOrder: { select: { id: true, orderNumber: true } } } } },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    return items.map(shipmentDto);
  },

  async invoices(user, customer) {
    const items = await prisma.invoice.findMany({
      where: invoiceWhere(user.companyId, customer.id),
      include: { exportOrder: { select: { id: true, orderNumber: true } } },
      orderBy: { issueDate: "desc" },
      take: 200,
    });
    return items.map(invoiceDto);
  },

  async documents(user, customer) {
    const items = await prisma.file.findMany({
      where: fileWhere(user.companyId, customer.id),
      select: { id: true, originalName: true, mimeType: true, size: true, createdAt: true, exportOrder: { select: { id: true, orderNumber: true } }, uploadedBy: { select: { firstName: true, lastName: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    return items.map((f) => toFileDto({ ...f, uploadedByCustomer: f.uploadedBy?.role === "CUSTOMER", uploadedBy: undefined }, user.id));
  },
};
