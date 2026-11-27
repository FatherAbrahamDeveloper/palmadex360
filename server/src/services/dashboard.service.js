import prisma from "../config/prisma.js";
import { atLeast } from "../config/access.js";
import { portalService, resolvePortalCustomer } from "./portal.service.js";
import {
  ACTIVE_ORDER, ACTIVE_SHIPMENT, startOfMonth, pctChange, paymentsByCurrency, primaryCurrency, money, buildInsights,
} from "./insights.service.js";

// Each card is computed only if the user can view its module. The first five available are shown,
// with CRM contacts always first for anyone who can see the CRM.
const CARD_BUILDERS = [
  {
    id: "crmContacts", module: "crm",
    async build({ companyId }, { thisMonth, lastMonth }) {
      const [total, newThis, newLast] = await Promise.all([
        prisma.cRMContact.count({ where: { companyId } }),
        prisma.cRMContact.count({ where: { companyId, createdAt: { gte: thisMonth } } }),
        prisma.cRMContact.count({ where: { companyId, createdAt: { gte: lastMonth, lt: thisMonth } } }),
      ]);
      return { label: "CRM Contacts", value: total, display: total.toLocaleString("en-US"), sub: `${newThis} new this month`, change: pctChange(newThis, newLast), changeLabel: "new vs last month", link: "/crm" };
    },
  },
  {
    id: "activeOrders", module: "orders",
    async build({ companyId }, { thisMonth, lastMonth }) {
      const [active, createdThis, createdLast] = await Promise.all([
        prisma.exportOrder.count({ where: { companyId, status: { in: ACTIVE_ORDER } } }),
        prisma.exportOrder.count({ where: { companyId, createdAt: { gte: thisMonth } } }),
        prisma.exportOrder.count({ where: { companyId, createdAt: { gte: lastMonth, lt: thisMonth } } }),
      ]);
      return { label: "Active Export Orders", value: active, display: active.toLocaleString("en-US"), sub: `${createdThis} placed this month`, change: pctChange(createdThis, createdLast), changeLabel: "orders vs last month", link: "/orders" };
    },
  },
  {
    id: "shipmentsInTransit", module: "shipping",
    async build({ companyId }) {
      const week = new Date(Date.now() + 7 * 86400_000);
      const [active, arriving] = await Promise.all([
        prisma.shipment.count({ where: { companyId, status: { in: ACTIVE_SHIPMENT } } }),
        prisma.shipment.count({ where: { companyId, status: { in: ACTIVE_SHIPMENT }, eta: { gte: new Date(), lte: week } } }),
      ]);
      return { label: "Shipments in Progress", value: active, display: active.toLocaleString("en-US"), sub: `${arriving} arriving in the next 7 days`, change: null, link: "/shipping" };
    },
  },
  {
    id: "revenueMtd", module: "finance",
    async build({ companyId }, { thisMonth, lastMonth, now }) {
      const [cur, prev] = await Promise.all([paymentsByCurrency(companyId, thisMonth, now), paymentsByCurrency(companyId, lastMonth, thisMonth)]);
      const currency = primaryCurrency(cur, prev);
      const value = cur[currency] || 0;
      const others = Object.keys(cur).filter((c) => c !== currency);
      return {
        label: "Revenue This Month", value, display: money(value, currency),
        sub: others.length ? `Plus ${others.map((c) => money(cur[c], c)).join(", ")}` : "Payments received",
        change: pctChange(value, prev[currency] || 0), changeLabel: "vs last month", link: "/finance",
      };
    },
  },
  {
    id: "suppliers", module: "suppliers",
    async build({ companyId }) {
      const [total, verified, pending] = await Promise.all([
        prisma.supplier.count({ where: { companyId } }),
        prisma.supplier.count({ where: { companyId, status: "VERIFIED" } }),
        prisma.supplier.count({ where: { companyId, status: { in: ["PENDING", "UNDER_REVIEW"] } } }),
      ]);
      return { label: "Suppliers", value: total, display: total.toLocaleString("en-US"), sub: `${verified} verified, ${pending} awaiting review`, change: null, link: "/suppliers" };
    },
  },
  {
    id: "openTickets", module: "support", level: "EDIT",
    async build({ companyId }) {
      const [open, urgent] = await Promise.all([
        prisma.supportTicket.count({ where: { companyId, status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_USER"] } } }),
        prisma.supportTicket.count({ where: { companyId, status: { in: ["OPEN", "IN_PROGRESS"] }, priority: "URGENT" } }),
      ]);
      return { label: "Open Support Tickets", value: open, display: String(open), sub: `${urgent} urgent`, change: null, link: "/support" };
    },
  },
  {
    id: "products", module: "products",
    async build({ companyId }, { thisMonth }) {
      const [active, added] = await Promise.all([
        prisma.product.count({ where: { companyId, isActive: true } }),
        prisma.product.count({ where: { companyId, createdAt: { gte: thisMonth } } }),
      ]);
      return { label: "Active Products", value: active, display: String(active), sub: `${added} added this month`, change: null, link: "/products" };
    },
  },
  {
    id: "lowStock", module: "inventory",
    async build({ companyId }) {
      const levels = await prisma.stockLevel.findMany({ where: { companyId }, select: { quantity: true, reorderLevel: true } });
      const low = levels.filter((l) => l.reorderLevel != null && Number(l.quantity) <= Number(l.reorderLevel)).length;
      return { label: "Low Stock Items", value: low, display: String(low), sub: `${levels.length} stock lines tracked`, change: null, link: "/inventory" };
    },
  },
  {
    id: "purchaseRequests", module: "procurement",
    async build({ companyId }) {
      const open = await prisma.purchaseRequest.count({ where: { companyId, status: { in: ["PENDING", "APPROVED", "IN_PROGRESS"] } } });
      return { label: "Open Purchase Requests", value: open, display: String(open), sub: "Pending, approved or in progress", change: null, link: "/procurement" };
    },
  },
  {
    id: "pendingApprovals", module: "access",
    async build({ companyId }) {
      const pending = await prisma.user.count({ where: { companyId, approvalStatus: "PENDING" } });
      return { label: "Pending Registrations", value: pending, display: String(pending), sub: "Awaiting approval", change: null, link: "/access" };
    },
  },
  {
    id: "knowledge", module: "knowledge",
    async build({ companyId, role }) {
      const count = await prisma.knowledgeArticle.count({ where: { companyId, status: "PUBLISHED", ...(role === "CUSTOMER" ? { audience: "ALL" } : {}) } });
      return { label: "Help Articles", value: count, display: String(count), sub: "Published in the Knowledge Base", change: null, link: "/knowledge" };
    },
  },
];

async function customerCards(user) {
  const customer = await resolvePortalCustomer(user).catch(() => null);
  if (!customer) {
    return [{ id: "portalPending", label: "Customer Portal", value: 0, display: "Not linked", sub: "Your account is waiting to be linked to a customer", change: null, link: "/support" }];
  }
  const s = await portalService.summary(user, customer);
  const outstanding = s.outstanding.map((o) => money(o.total, o.currency)).join(" + ") || money(0, "USD");
  return [
    { id: "myOrders", label: "Active Orders", value: s.counts.activeOrders, display: String(s.counts.activeOrders), sub: `${s.counts.orders} orders in total`, change: null, link: "/portal?tab=orders" },
    { id: "myShipments", label: "Shipments in Progress", value: s.counts.activeShipments, display: String(s.counts.activeShipments), sub: s.nextShipment?.eta ? `Next arrival ${new Date(s.nextShipment.eta).toDateString()}` : "Tracking live", change: null, link: "/portal?tab=shipments" },
    { id: "myInvoices", label: "Unpaid Invoices", value: s.counts.unpaidInvoices, display: String(s.counts.unpaidInvoices), sub: `${outstanding} outstanding`, change: null, link: "/portal?tab=invoices" },
    { id: "myDocuments", label: "Documents", value: s.counts.documents, display: String(s.counts.documents), sub: "Shared with you", change: null, link: "/portal?tab=documents" },
    { id: "myTickets", label: "Open Tickets", value: s.counts.openTickets, display: String(s.counts.openTickets), sub: "Support requests", change: null, link: "/support" },
  ];
}

export const dashboardService = {
  async summary(user) {
    const now = new Date();
    const ctx = { now, thisMonth: startOfMonth(now), lastMonth: startOfMonth(now, -1) };

    let cards;
    if (user.role === "CUSTOMER") {
      cards = await customerCards(user);
    } else {
      const perms = user.permissions || {};
      const eligible = CARD_BUILDERS.filter((b) => user.role === "SUPER_ADMIN" || atLeast(perms[b.module] || "NONE", b.level || "VIEW")).slice(0, 5);
      cards = await Promise.all(eligible.map(async (b) => ({ id: b.id, module: b.module, ...(await b.build(user, ctx)) })));
    }

    const insights = user.role === "CUSTOMER" ? [] : (await buildInsights(user)).slice(0, 6);
    return { cards, insights, generatedAt: now };
  },
};
