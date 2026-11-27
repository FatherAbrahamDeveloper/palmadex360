import prisma from "../config/prisma.js";
import { permissionService } from "./permission.service.js";

// Shared helpers for the dashboard and Reports & Analytics. All figures come from live data.

export const ACTIVE_ORDER = ["PENDING", "PROCESSING", "IN_TRANSIT"];
export const ACTIVE_SHIPMENT = ["BOOKED", "LOADING", "AT_SEA", "CUSTOMS"];
const OPEN_TICKET = ["OPEN", "IN_PROGRESS", "WAITING_ON_USER"];
const CLOSED_CRM = ["WON", "LOST", "CLOSED"];

export const startOfMonth = (d = new Date(), offset = 0) => new Date(d.getFullYear(), d.getMonth() + offset, 1);
export const pctChange = (current, previous) => {
  if (!previous) return current ? null : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};
export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export async function viewable(user, modules) {
  const out = {};
  for (const m of modules) out[m] = await permissionService.can(user, m, "VIEW");
  return out;
}

// Sum of payments received between two dates, by currency.
export async function paymentsByCurrency(companyId, from, to) {
  const rows = await prisma.invoicePayment.findMany({
    where: { paidAt: { gte: from, lt: to }, invoice: { companyId } },
    select: { amount: true, invoice: { select: { currency: true } } },
  });
  const out = {};
  for (const r of rows) out[r.invoice.currency] = (out[r.invoice.currency] || 0) + Number(r.amount);
  return out;
}

export function primaryCurrency(...maps) {
  const totals = {};
  for (const m of maps) for (const [c, v] of Object.entries(m || {})) totals[c] = (totals[c] || 0) + v;
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || "USD";
}

export const money = (amount, currency) => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: amount >= 1e5 ? 0 : 2, notation: amount >= 1e7 ? "compact" : "standard" }).format(amount);
  } catch {
    return `${currency} ${round2(amount).toLocaleString("en-US")}`;
  }
};

// Rule-based, actionable alerts limited to modules the user can view.
export async function buildInsights(user) {
  const { companyId } = user;
  const can = await viewable(user, ["finance", "shipping", "inventory", "crm", "suppliers", "support", "access", "compliance", "orders"]);
  const now = new Date();
  const soon = new Date(Date.now() + 30 * 86400_000);
  const insights = [];
  const tasks = [];

  if (can.finance) tasks.push((async () => {
    const overdue = await prisma.invoice.findMany({
      where: { companyId, status: { in: ["PENDING", "PARTIALLY_PAID"] }, dueDate: { lt: now } },
      select: { amount: true, amountPaid: true, currency: true },
    });
    if (overdue.length) {
      const byCur = {};
      for (const i of overdue) byCur[i.currency] = (byCur[i.currency] || 0) + Number(i.amount) - Number(i.amountPaid);
      insights.push({
        level: "warning", module: "finance", link: "/finance",
        title: `${overdue.length} overdue invoice${overdue.length > 1 ? "s" : ""}`,
        detail: `${Object.entries(byCur).map(([c, v]) => money(v, c)).join(" + ")} is past due. Follow up with these customers.`,
      });
    }
  })());

  if (can.shipping) tasks.push((async () => {
    const late = await prisma.shipment.count({ where: { companyId, status: { in: ACTIVE_SHIPMENT }, eta: { lt: now } } });
    if (late) insights.push({ level: "warning", module: "shipping", link: "/shipping", title: `${late} shipment${late > 1 ? "s" : ""} past ETA`, detail: "These shipments have not been marked as arrived. Update their status or contact the shipping line." });
  })());

  if (can.inventory) tasks.push((async () => {
    const levels = await prisma.stockLevel.findMany({ where: { companyId, reorderLevel: { not: null } }, select: { quantity: true, reorderLevel: true } });
    const low = levels.filter((l) => Number(l.quantity) <= Number(l.reorderLevel)).length;
    if (low) insights.push({ level: "warning", module: "inventory", link: "/inventory", title: `${low} stock item${low > 1 ? "s" : ""} at or below reorder level`, detail: "Raise purchase requests before these run out." });
  })());

  if (can.crm) tasks.push((async () => {
    const due = await prisma.cRMContact.count({ where: { companyId, nextFollowUpAt: { lt: now }, status: { notIn: CLOSED_CRM } } });
    if (due) insights.push({ level: "info", module: "crm", link: "/crm", title: `${due} CRM follow-up${due > 1 ? "s" : ""} overdue`, detail: "Contacts are waiting to hear back from the team." });
  })());

  if (can.suppliers) tasks.push((async () => {
    const pending = await prisma.supplier.count({ where: { companyId, status: { in: ["PENDING", "UNDER_REVIEW"] } } });
    if (pending) insights.push({ level: "info", module: "suppliers", link: "/suppliers", title: `${pending} supplier application${pending > 1 ? "s" : ""} to review`, detail: "Verify new suppliers so they can be used in procurement." });
  })());

  if (can.support) tasks.push((async () => {
    const [unassigned, urgent] = await Promise.all([
      prisma.supportTicket.count({ where: { companyId, status: { in: OPEN_TICKET }, assignedToId: null } }),
      prisma.supportTicket.count({ where: { companyId, status: { in: OPEN_TICKET }, priority: "URGENT" } }),
    ]);
    if (urgent) insights.push({ level: "warning", module: "support", link: "/support", title: `${urgent} urgent ticket${urgent > 1 ? "s" : ""} open`, detail: "Urgent customer issues need a response today." });
    if (unassigned) insights.push({ level: "info", module: "support", link: "/support", title: `${unassigned} ticket${unassigned > 1 ? "s" : ""} unassigned`, detail: "Assign them so customers get a timely reply." });
  })());

  if (can.access) tasks.push((async () => {
    const [pending, faces] = await Promise.all([
      prisma.user.count({ where: { companyId, approvalStatus: "PENDING" } }),
      prisma.user.count({ where: { companyId, faceStatus: "PENDING" } }),
    ]);
    if (pending) insights.push({ level: "info", module: "access", link: "/access", title: `${pending} registration${pending > 1 ? "s" : ""} awaiting approval`, detail: "Approve new users and assign their roles." });
    if (faces) insights.push({ level: "info", module: "access", link: "/access", title: `${faces} face photo${faces > 1 ? "s" : ""} to verify`, detail: "Confirm each person's identity in User & Access Management." });
  })());

  if (can.compliance) tasks.push((async () => {
    const [atRisk, expiring] = await Promise.all([
      prisma.complianceRequirement.count({ where: { companyId, status: { in: ["ACTION_REQUIRED", "EXPIRED"] } } }),
      prisma.complianceRequirement.count({ where: { companyId, status: { notIn: ["EXPIRED"] }, OR: [{ dueDate: { gte: now, lte: soon } }, { expiryDate: { gte: now, lte: soon } }] } }),
    ]);
    if (atRisk) insights.push({ level: "warning", module: "compliance", link: "/compliance", title: `${atRisk} compliance requirement${atRisk > 1 ? "s" : ""} need action`, detail: "Expired or action-required items can block shipments." });
    if (expiring) insights.push({ level: "info", module: "compliance", link: "/compliance", title: `${expiring} compliance deadline${expiring > 1 ? "s" : ""} in the next 30 days`, detail: "Renew certificates and permits before they lapse." });
  })());

  if (can.orders) tasks.push((async () => {
    const stale = await prisma.exportOrder.count({ where: { companyId, status: "PENDING", createdAt: { lt: new Date(Date.now() - 2 * 86400_000) } } });
    if (stale) insights.push({ level: "info", module: "orders", link: "/orders", title: `${stale} order${stale > 1 ? "s" : ""} pending for more than 2 days`, detail: "Confirm or update these orders so customers know where they stand." });
  })());

  await Promise.all(tasks);
  const rank = { warning: 0, info: 1, success: 2 };
  return insights.sort((a, b) => rank[a.level] - rank[b.level]);
}
