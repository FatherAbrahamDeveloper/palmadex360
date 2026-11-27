import prisma from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";
import {
  viewable, startOfMonth, pctChange, round2, primaryCurrency, buildInsights, ACTIVE_SHIPMENT,
} from "./insights.service.js";

const MONTH_LABEL = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

function monthsBetween(from, to) {
  const out = [];
  for (let d = startOfMonth(from); d < to; d = startOfMonth(d, 1)) out.push({ key: monthKey(d), label: MONTH_LABEL.format(d) });
  return out;
}

export function parseRange({ from, to, months }) {
  const end = to ? new Date(to) : new Date();
  if (Number.isNaN(end.getTime())) throw new HttpError(400, "Invalid end date");
  const toExclusive = to ? new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1) : end;
  let start;
  if (from) {
    start = new Date(from);
    if (Number.isNaN(start.getTime())) throw new HttpError(400, "Invalid start date");
  } else {
    start = startOfMonth(end, -((Number(months) || 12) - 1));
  }
  if (start >= toExclusive) throw new HttpError(400, "The start date must be before the end date");
  if (toExclusive - start > 5 * 366 * 86400_000) throw new HttpError(400, "Choose a range of five years or less");
  return { from: start, to: toExclusive };
}

const sumBy = (rows, keyFn, valFn) => {
  const out = {};
  for (const r of rows) {
    const k = keyFn(r);
    out[k] = (out[k] || 0) + valFn(r);
  }
  return out;
};
const top = (obj, n = 5) => Object.entries(obj).sort((a, b) => b[1].value - a[1].value || b[1].count - a[1].count).slice(0, n);

async function collect(user, from, to, can) {
  const { companyId } = user;
  const range = { gte: from, lt: to };
  const [orders, payments, invoices, expenses, shipments, contacts, tickets, purchases] = await Promise.all([
    can.orders ? prisma.exportOrder.findMany({ where: { companyId, createdAt: range }, select: { createdAt: true, status: true, totalValue: true, currency: true, customerName: true, productName: true, quantity: true, unit: true } }) : [],
    can.finance ? prisma.invoicePayment.findMany({ where: { paidAt: range, invoice: { companyId } }, select: { paidAt: true, amount: true, method: true, invoice: { select: { currency: true } } } }) : [],
    can.finance ? prisma.invoice.findMany({ where: { companyId, issueDate: range }, select: { issueDate: true, amount: true, amountPaid: true, currency: true, status: true, dueDate: true } }) : [],
    can.finance ? prisma.expense.findMany({ where: { companyId, expenseDate: range }, select: { expenseDate: true, amount: true, currency: true, category: true } }) : [],
    can.shipping ? prisma.shipment.findMany({ where: { companyId, createdAt: range }, select: { createdAt: true, status: true, destinationPort: true, eta: true, events: { where: { toStatus: "ARRIVED" }, select: { createdAt: true }, take: 1 } } }) : [],
    can.crm ? prisma.cRMContact.findMany({ where: { companyId, createdAt: range }, select: { createdAt: true, status: true, source: true } }) : [],
    can.support ? prisma.supportTicket.findMany({ where: { companyId, createdAt: range }, select: { createdAt: true, status: true, category: true, resolvedAt: true, priority: true } }) : [],
    can.procurement ? prisma.purchaseRequest.findMany({ where: { companyId, createdAt: range }, select: { createdAt: true, status: true, estimatedCost: true, currency: true } }) : [],
  ]);
  return { orders, payments, invoices, expenses, shipments, contacts, tickets, purchases };
}

function summarise(data, currencyHint) {
  const { orders, payments, invoices, expenses, shipments, contacts, tickets } = data;
  const liveOrders = orders.filter((o) => o.status !== "CANCELLED");
  const orderValueByCur = sumBy(liveOrders, (o) => o.currency, (o) => Number(o.totalValue));
  const revenueByCur = sumBy(payments, (p) => p.invoice.currency, (p) => Number(p.amount));
  const expensesByCur = sumBy(expenses, (e) => e.currency, (e) => Number(e.amount));
  const invoicedByCur = sumBy(invoices.filter((i) => i.status !== "CANCELLED"), (i) => i.currency, (i) => Number(i.amount));
  const currency = currencyHint || primaryCurrency(orderValueByCur, revenueByCur, invoicedByCur);

  const arrived = shipments.filter((s) => s.status === "ARRIVED");
  const withEta = arrived.filter((s) => s.eta && s.events[0]);
  const onTime = withEta.filter((s) => s.events[0].createdAt <= new Date(new Date(s.eta).getTime() + 86400_000)).length;
  const won = contacts.filter((c) => c.status === "WON").length;
  const resolvedTickets = tickets.filter((t) => t.resolvedAt);
  const resHours = resolvedTickets.map((t) => (t.resolvedAt - t.createdAt) / 3600_000);

  return {
    currency,
    ordersCount: orders.length,
    cancelledOrders: orders.length - liveOrders.length,
    orderValue: round2(orderValueByCur[currency] || 0),
    avgOrderValue: liveOrders.filter((o) => o.currency === currency).length ? round2((orderValueByCur[currency] || 0) / liveOrders.filter((o) => o.currency === currency).length) : 0,
    revenue: round2(revenueByCur[currency] || 0),
    invoiced: round2(invoicedByCur[currency] || 0),
    expenses: round2(expensesByCur[currency] || 0),
    net: round2((revenueByCur[currency] || 0) - (expensesByCur[currency] || 0)),
    shipmentsCount: shipments.length,
    shipmentsArrived: arrived.length,
    onTimeRate: withEta.length ? Math.round((onTime / withEta.length) * 100) : null,
    newContacts: contacts.length,
    conversionRate: contacts.length ? Math.round((won / contacts.length) * 1000) / 10 : null,
    ticketsOpened: tickets.length,
    ticketsResolved: resolvedTickets.length,
    avgResolutionHours: resHours.length ? Math.round((resHours.reduce((a, b) => a + b, 0) / resHours.length) * 10) / 10 : null,
    byCurrency: {
      orderValue: Object.fromEntries(Object.entries(orderValueByCur).map(([k, v]) => [k, round2(v)])),
      revenue: Object.fromEntries(Object.entries(revenueByCur).map(([k, v]) => [k, round2(v)])),
      expenses: Object.fromEntries(Object.entries(expensesByCur).map(([k, v]) => [k, round2(v)])),
    },
  };
}

function breakdowns(data, currency) {
  const { orders, shipments, contacts, tickets, expenses, payments } = data;
  const liveOrders = orders.filter((o) => o.status !== "CANCELLED");

  const customers = {};
  for (const o of liveOrders) {
    const c = (customers[o.customerName] ||= { count: 0, value: 0 });
    c.count += 1;
    if (o.currency === currency) c.value += Number(o.totalValue);
  }
  const products = {};
  for (const o of liveOrders) {
    const p = (products[o.productName] ||= { count: 0, value: 0, quantity: 0, unit: o.unit });
    p.count += 1;
    p.quantity += Number(o.quantity);
    if (o.currency === currency) p.value += Number(o.totalValue);
  }
  const markets = {};
  for (const s of shipments) {
    const m = (markets[s.destinationPort] ||= { count: 0, value: 0 });
    m.count += 1;
  }
  const count = (rows, key) => Object.entries(sumBy(rows, (r) => r[key], () => 1)).map(([k, v]) => ({ key: k, count: v })).sort((a, b) => b.count - a.count);

  return {
    topCustomers: top(customers).map(([name, v]) => ({ name, orders: v.count, value: round2(v.value) })),
    topProducts: top(products).map(([name, v]) => ({ name, orders: v.count, quantity: round2(v.quantity), unit: v.unit, value: round2(v.value) })),
    markets: Object.entries(markets).sort((a, b) => b[1].count - a[1].count).slice(0, 8).map(([destination, v]) => ({ destination, shipments: v.count })),
    orderStatus: count(orders, "status"),
    shipmentStatus: count(shipments, "status"),
    crmPipeline: count(contacts, "status"),
    crmSources: count(contacts, "source"),
    ticketCategories: count(tickets, "category"),
    expenseCategories: Object.entries(sumBy(expenses.filter((e) => e.currency === currency), (e) => e.category, (e) => Number(e.amount))).map(([key, v]) => ({ key, amount: round2(v) })).sort((a, b) => b.amount - a.amount),
    paymentMethods: count(payments.map((p) => ({ method: p.method })), "method"),
  };
}

function monthlySeries(data, from, to, currency) {
  const months = monthsBetween(from, to);
  const blank = () => ({ orders: 0, orderValue: 0, revenue: 0, expenses: 0, shipments: 0, newContacts: 0, tickets: 0 });
  const map = Object.fromEntries(months.map((m) => [m.key, { month: m.key, label: m.label, ...blank() }]));
  const add = (date, field, v = 1) => { const row = map[monthKey(new Date(date))]; if (row) row[field] += v; };
  for (const o of data.orders) { add(o.createdAt, "orders"); if (o.status !== "CANCELLED" && o.currency === currency) add(o.createdAt, "orderValue", Number(o.totalValue)); }
  for (const p of data.payments) if (p.invoice.currency === currency) add(p.paidAt, "revenue", Number(p.amount));
  for (const e of data.expenses) if (e.currency === currency) add(e.expenseDate, "expenses", Number(e.amount));
  for (const s of data.shipments) add(s.createdAt, "shipments");
  for (const c of data.contacts) add(c.createdAt, "newContacts");
  for (const t of data.tickets) add(t.createdAt, "tickets");
  return Object.values(map).map((r) => ({ ...r, orderValue: round2(r.orderValue), revenue: round2(r.revenue), expenses: round2(r.expenses), net: round2(r.revenue - r.expenses) }));
}

const SECTION_MODULES = ["orders", "finance", "shipping", "crm", "support", "procurement", "suppliers", "inventory"];

export const reportsService = {
  async overview(user, query) {
    const { from, to } = parseRange(query);
    const can = await viewable(user, SECTION_MODULES);
    const data = await collect(user, from, to, can);
    const kpis = summarise(data);
    const currency = kpis.currency;

    // Trend: this month against last month, using the same rules.
    const now = new Date();
    const [thisData, prevData] = await Promise.all([
      collect(user, startOfMonth(now), now, can),
      collect(user, startOfMonth(now, -1), startOfMonth(now), can),
    ]);
    const cur = summarise(thisData, currency);
    const prev = summarise(prevData, currency);
    const trends = {};
    for (const k of ["ordersCount", "orderValue", "revenue", "expenses", "shipmentsCount", "newContacts", "ticketsOpened"]) {
      trends[k] = { current: cur[k], previous: prev[k], change: pctChange(cur[k], prev[k]) };
    }

    const [suppliers, lowStock] = await Promise.all([
      can.suppliers ? prisma.supplier.groupBy({ by: ["status"], where: { companyId: user.companyId }, _count: { _all: true } }) : [],
      can.inventory ? prisma.stockLevel.findMany({ where: { companyId: user.companyId, reorderLevel: { not: null } }, select: { quantity: true, reorderLevel: true } }) : [],
    ]);

    return {
      range: { from, to },
      sections: can,
      currency,
      kpis,
      trends,
      monthly: monthlySeries(data, from, to, currency),
      breakdowns: breakdowns(data, currency),
      suppliers: suppliers.map((s) => ({ key: s.status, count: s._count._all })),
      lowStockCount: lowStock.filter((l) => Number(l.quantity) <= Number(l.reorderLevel)).length,
      insights: await buildInsights(user),
      generatedAt: new Date(),
    };
  },

  // Month-end report: one month against the month before.
  async monthly(user, { month }) {
    const m = /^(\d{4})-(\d{2})$/.exec(month || "") ;
    const base = m ? new Date(Number(m[1]), Number(m[2]) - 1, 1) : startOfMonth(new Date());
    const from = startOfMonth(base);
    const to = startOfMonth(base, 1);
    const prevFrom = startOfMonth(base, -1);
    const can = await viewable(user, SECTION_MODULES);
    const [data, prevData] = await Promise.all([collect(user, from, to, can), collect(user, prevFrom, from, can)]);
    const current = summarise(data);
    const previous = summarise(prevData, current.currency);
    const changes = {};
    for (const k of Object.keys(current)) {
      if (typeof current[k] === "number") changes[k] = pctChange(current[k], previous[k] || 0);
    }
    const highlights = [];
    if (can.orders) highlights.push(`${current.ordersCount} export order${current.ordersCount === 1 ? "" : "s"} placed${changes.ordersCount != null ? ` (${changes.ordersCount >= 0 ? "+" : ""}${changes.ordersCount}% on the previous month)` : ""}.`);
    if (can.finance) highlights.push(`${current.currency} ${current.revenue.toLocaleString("en-US")} received against ${current.currency} ${current.expenses.toLocaleString("en-US")} in expenses.`);
    if (can.shipping) highlights.push(`${current.shipmentsCount} shipment${current.shipmentsCount === 1 ? "" : "s"} booked and ${current.shipmentsArrived} arrived${current.onTimeRate != null ? `, ${current.onTimeRate}% on time` : ""}.`);
    if (can.crm) highlights.push(`${current.newContacts} new CRM contact${current.newContacts === 1 ? "" : "s"}${current.conversionRate != null ? `, ${current.conversionRate}% won` : ""}.`);
    if (can.support) highlights.push(`${current.ticketsOpened} support ticket${current.ticketsOpened === 1 ? "" : "s"} opened and ${current.ticketsResolved} resolved.`);

    return {
      month: monthKey(from), label: new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(from),
      sections: can, current, previous, changes, highlights,
      breakdowns: breakdowns(data, current.currency),
      weekly: weeklySeries(data, from, to, current.currency),
    };
  },

  // CSV downloads, limited to datasets the user can view.
  async exportCsv(user, { dataset, ...rangeQuery }) {
    const { from, to } = parseRange(rangeQuery);
    const { companyId } = user;
    const range = { gte: from, lt: to };
    const can = await viewable(user, SECTION_MODULES);
    const need = { orders: "orders", shipments: "shipping", invoices: "finance", payments: "finance", expenses: "finance", contacts: "crm", tickets: "support", purchases: "procurement" }[dataset];
    if (!need) throw new HttpError(400, "Unknown dataset");
    if (!can[need]) throw new HttpError(403, "You do not have permission to export this data");

    const d = (v) => (v ? new Date(v).toISOString().slice(0, 10) : "");
    let header, rows;
    if (dataset === "orders") {
      const items = await prisma.exportOrder.findMany({ where: { companyId, createdAt: range }, orderBy: { createdAt: "asc" } });
      header = ["Order number", "Date", "Customer", "Product", "Quantity", "Unit", "Value", "Currency", "Status"];
      rows = items.map((o) => [o.orderNumber, d(o.createdAt), o.customerName, o.productName, Number(o.quantity), o.unit, Number(o.totalValue), o.currency, o.status]);
    } else if (dataset === "shipments") {
      const items = await prisma.shipment.findMany({ where: { companyId, createdAt: range }, orderBy: { createdAt: "asc" } });
      header = ["Shipment number", "Created", "Vessel", "Shipping line", "Origin", "Destination", "ETD", "ETA", "Containers", "Status"];
      rows = items.map((s) => [s.shipmentNumber, d(s.createdAt), s.vesselName, s.shippingLine, s.originPort, s.destinationPort, d(s.etd), d(s.eta), s.containerCount, s.status]);
    } else if (dataset === "invoices") {
      const items = await prisma.invoice.findMany({ where: { companyId, issueDate: range }, orderBy: { issueDate: "asc" } });
      header = ["Invoice number", "Issued", "Due", "Customer", "Amount", "Paid", "Balance", "Currency", "Status"];
      rows = items.map((i) => [i.invoiceNumber, d(i.issueDate), d(i.dueDate), i.customerName, Number(i.amount), Number(i.amountPaid), round2(Number(i.amount) - Number(i.amountPaid)), i.currency, i.status]);
    } else if (dataset === "payments") {
      const items = await prisma.invoicePayment.findMany({ where: { paidAt: range, invoice: { companyId } }, include: { invoice: { select: { invoiceNumber: true, customerName: true, currency: true } } }, orderBy: { paidAt: "asc" } });
      header = ["Paid on", "Invoice", "Customer", "Amount", "Currency", "Method", "Reference"];
      rows = items.map((p) => [d(p.paidAt), p.invoice.invoiceNumber, p.invoice.customerName, Number(p.amount), p.invoice.currency, p.method, p.reference]);
    } else if (dataset === "expenses") {
      const items = await prisma.expense.findMany({ where: { companyId, expenseDate: range }, orderBy: { expenseDate: "asc" } });
      header = ["Date", "Category", "Description", "Vendor", "Amount", "Currency", "Reference"];
      rows = items.map((e) => [d(e.expenseDate), e.category, e.description, e.vendor, Number(e.amount), e.currency, e.reference]);
    } else if (dataset === "contacts") {
      const items = await prisma.cRMContact.findMany({ where: { companyId, createdAt: range }, orderBy: { createdAt: "asc" } });
      header = ["Name", "Company", "Email", "Phone", "Source", "Status", "Created", "Next follow-up"];
      rows = items.map((c) => [c.displayName, c.companyName, c.email, c.phone, c.source, c.status, d(c.createdAt), d(c.nextFollowUpAt)]);
    } else if (dataset === "tickets") {
      const items = await prisma.supportTicket.findMany({ where: { companyId, createdAt: range }, include: { assignedTo: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: "asc" } });
      header = ["Ticket", "Opened", "Subject", "Category", "Priority", "Status", "Assigned to", "Resolved"];
      rows = items.map((t) => [t.ticketNumber, d(t.createdAt), t.subject, t.category, t.priority, t.status, t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : "", d(t.resolvedAt)]);
    } else {
      const items = await prisma.purchaseRequest.findMany({ where: { companyId, createdAt: range }, orderBy: { createdAt: "asc" } });
      header = ["Request number", "Created", "Item", "Quantity", "Unit", "Estimated cost", "Currency", "Supplier", "Status"];
      rows = items.map((p) => [p.requestNumber, d(p.createdAt), p.itemName, p.quantity != null ? Number(p.quantity) : "", p.unit, p.estimatedCost != null ? Number(p.estimatedCost) : "", p.currency, p.supplierName, p.status]);
    }
    // Quote every cell; prefix formula-like values so spreadsheets do not execute them.
    const cell = (v) => {
      let s = v == null ? "" : String(v);
      if (/^[=+\-@\t\r]/.test(s) && typeof v !== "number") s = `'${s}`;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const csv = [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
    return { filename: `palmadex-${dataset}-${d(from)}-to-${d(new Date(to - 1))}.csv`, csv: `﻿${csv}` };
  },
};

function weeklySeries(data, from, to, currency) {
  const weeks = [];
  for (let d = new Date(from); d < to; d = new Date(d.getTime() + 7 * 86400_000)) {
    const end = new Date(Math.min(d.getTime() + 7 * 86400_000, to.getTime()));
    const inRange = (x) => new Date(x) >= d && new Date(x) < end;
    weeks.push({
      label: `${d.getDate()} ${MONTH_LABEL.format(d).split(" ")[0]}`,
      orders: data.orders.filter((o) => inRange(o.createdAt)).length,
      revenue: round2(data.payments.filter((p) => p.invoice.currency === currency && inRange(p.paidAt)).reduce((a, p) => a + Number(p.amount), 0)),
      shipments: data.shipments.filter((s) => inRange(s.createdAt)).length,
    });
  }
  return weeks;
}

export { ACTIVE_SHIPMENT };
