import prisma from "../config/prisma.js";

const OPEN = ["PENDING", "PARTIALLY_PAID"];
const cents = (v) => Math.round(Number(v) * 100);

const invoiceListInclude = { exportOrder: { select: { id: true, orderNumber: true } } };

const invoiceDetailInclude = {
  ...invoiceListInclude,
  payments: {
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
    include: { recordedBy: { select: { id: true, firstName: true, lastName: true } } },
  },
};

export const financeRepository = {
  /* ---------- Invoices ---------- */

  async listInvoices({ where, skip, take, orderBy }) {
    const [items, total] = await prisma.$transaction([
      prisma.invoice.findMany({ where, include: invoiceListInclude, skip, take, orderBy }),
      prisma.invoice.count({ where }),
    ]);
    return { items, total };
  },

  findInvoice: (companyId, id) =>
    prisma.invoice.findFirst({ where: { id, companyId }, include: invoiceDetailInclude }),
  createInvoice: (data) => prisma.invoice.create({ data, include: invoiceDetailInclude }),
  updateInvoice: (id, data) => prisma.invoice.update({ where: { id }, data, include: invoiceDetailInclude }),
  deleteInvoice: (id) => prisma.invoice.delete({ where: { id } }),

  findLastInvoiceNumber: (companyId, prefix) =>
    prisma.invoice.findFirst({
      where: { companyId, invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: "desc" },
      select: { invoiceNumber: true },
    }),

  findExportOrder: (companyId, id) => prisma.exportOrder.findFirst({ where: { id, companyId } }),

  // Only a pending invoice (no payments) can be cancelled; returns how many rows changed.
  cancelInvoice: (companyId, id) =>
    prisma.invoice.updateMany({
      where: { id, companyId, status: "PENDING" },
      data: { status: "CANCELLED" },
    }),

  recordPayment({ invoiceId, userId, amount, method, paidAt, reference, note }) {
    return prisma.$transaction(async (tx) => {
      await tx.invoicePayment.create({
        data: { invoiceId, amount, method, paidAt, reference, note, recordedById: userId },
      });
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { amountPaid: { increment: amount } },
      });
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
      const paid = cents(invoice.amountPaid);
      const total = cents(invoice.amount);
      if (paid > total) throw new Error("OVERPAYMENT"); // rolls the whole transaction back
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: paid === total ? "PAID" : "PARTIALLY_PAID" },
      });
      return tx.invoice.findUnique({ where: { id: invoiceId }, include: invoiceDetailInclude });
    });
  },

  removePayment({ invoiceId, paymentId }) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.invoicePayment.findFirst({ where: { id: paymentId, invoiceId } });
      if (!payment) return null;
      await tx.invoicePayment.delete({ where: { id: paymentId } });
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { amountPaid: { decrement: payment.amount } },
      });
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: cents(invoice.amountPaid) <= 0 ? "PENDING" : "PARTIALLY_PAID" },
      });
      return tx.invoice.findUnique({ where: { id: invoiceId }, include: invoiceDetailInclude });
    });
  },

  /* ---------- Expenses ---------- */

  async listExpenses({ where, skip, take, orderBy }) {
    const [items, total] = await prisma.$transaction([
      prisma.expense.findMany({ where, skip, take, orderBy }),
      prisma.expense.count({ where }),
    ]);
    return { items, total };
  },

  findExpense: (companyId, id) => prisma.expense.findFirst({ where: { id, companyId } }),
  createExpense: (data) => prisma.expense.create({ data }),
  updateExpense: (id, data) => prisma.expense.update({ where: { id }, data }),
  deleteExpense: (id) => prisma.expense.delete({ where: { id } }),

  /* ---------- Summary ---------- */

  async listCurrencies(companyId) {
    const [a, b] = await Promise.all([
      prisma.invoice.groupBy({ by: ["currency"], where: { companyId } }),
      prisma.expense.groupBy({ by: ["currency"], where: { companyId } }),
    ]);
    return [...new Set([...a, ...b].map((x) => x.currency))].sort();
  },

  async summary(companyId, currency, r, today) {
    const revenueWhere = (from, to) => ({
      companyId, currency, status: { not: "CANCELLED" }, issueDate: { gte: from, lte: to },
    });
    const expenseWhere = (from, to) => ({ companyId, currency, expenseDate: { gte: from, lte: to } });
    const total = (agg) => Number(agg._sum.amount ?? 0);

    const [rev, prevRev, open, overdueCount, exp, prevExp] = await Promise.all([
      prisma.invoice.aggregate({ where: revenueWhere(r.yearStart, r.todayEnd), _sum: { amount: true } }),
      prisma.invoice.aggregate({ where: revenueWhere(r.prevYearStart, r.prevYearEnd), _sum: { amount: true } }),
      prisma.invoice.aggregate({
        where: { companyId, currency, status: { in: OPEN } },
        _sum: { amount: true, amountPaid: true },
        _count: { _all: true },
      }),
      prisma.invoice.count({ where: { companyId, currency, status: { in: OPEN }, dueDate: { lt: today } } }),
      prisma.expense.aggregate({ where: expenseWhere(r.monthStart, r.todayEnd), _sum: { amount: true } }),
      prisma.expense.aggregate({ where: expenseWhere(r.prevMonthStart, r.prevMonthEnd), _sum: { amount: true } }),
    ]);

    return {
      revenueYtd: total(rev),
      revenuePrevYtd: total(prevRev),
      outstanding: Number(open._sum.amount ?? 0) - Number(open._sum.amountPaid ?? 0),
      outstandingCount: open._count._all,
      overdueCount,
      expensesMtd: total(exp),
      expensesPrevMtd: total(prevExp),
    };
  },
};