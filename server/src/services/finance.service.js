import { financeRepository as repo } from "../repositories/finance.repository.js";
import { HttpError } from "./product.service.js";

const OPEN = ["PENDING", "PARTIALLY_PAID"];
const cents = (v) => Math.round(Number(v) * 100);
const round2 = (n) => Math.round(n * 100) / 100;

const startOfTodayUTC = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
};

const fullName = (u) => (u ? { id: u.id, name: `${u.firstName} ${u.lastName}` } : null);

const paymentDto = (p) => ({
  id: p.id,
  amount: Number(p.amount),
  method: p.method,
  paidAt: p.paidAt,
  reference: p.reference,
  note: p.note,
  recordedBy: fullName(p.recordedBy),
  createdAt: p.createdAt,
});

const invoiceDto = (i) => {
  const amount = Number(i.amount);
  const amountPaid = Number(i.amountPaid);
  const isOpen = OPEN.includes(i.status);
  const overdue = isOpen && new Date(i.dueDate) < startOfTodayUTC();
  return {
    id: i.id,
    invoiceNumber: i.invoiceNumber,
    customerName: i.customerName,
    exportOrderId: i.exportOrderId,
    exportOrder: i.exportOrder || null,
    issueDate: i.issueDate,
    dueDate: i.dueDate,
    currency: i.currency,
    amount,
    amountPaid,
    balance: round2(amount - amountPaid),
    status: i.status,
    displayStatus: overdue ? "OVERDUE" : i.status,
    notes: i.notes,
    canEdit: i.status === "PENDING",
    canCancel: i.status === "PENDING",
    canDelete: cents(i.amountPaid) === 0,
    canRecordPayment: isOpen,
    ...(i.payments && { payments: i.payments.map(paymentDto) }),
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  };
};

const expenseDto = (e) => ({
  id: e.id,
  expenseDate: e.expenseDate,
  category: e.category,
  description: e.description,
  vendor: e.vendor,
  amount: Number(e.amount),
  currency: e.currency,
  reference: e.reference,
  notes: e.notes,
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
});

const pageMeta = (page, limit, total) => ({
  page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)),
});

async function generateInvoiceNumber(companyId) {
  const prefix = `INV-${new Date().getFullYear()}-`;
  const last = await repo.findLastInvoiceNumber(companyId, prefix);
  const next = last ? parseInt(last.invoiceNumber.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(Number.isNaN(next) ? 1 : next).padStart(4, "0")}`;
}

// The status filter matches what the user sees: "Overdue" is an unpaid invoice past its due date.
function invoiceWhere(companyId, { search, status }) {
  const where = { companyId };
  const today = startOfTodayUTC();
  if (status === "OVERDUE") Object.assign(where, { status: { in: OPEN }, dueDate: { lt: today } });
  else if (OPEN.includes(status)) Object.assign(where, { status, dueDate: { gte: today } });
  else if (status) where.status = status;
  if (search) {
    where.OR = [{ invoiceNumber: { contains: search } }, { customerName: { contains: search } }];
  }
  return where;
}

function assertDueDate(issueDate, dueDate) {
  if (new Date(dueDate) < new Date(issueDate)) {
    throw new HttpError(400, "Due date cannot be earlier than the issue date");
  }
}

async function checkOrder(companyId, exportOrderId) {
  if (!exportOrderId) return;
  const order = await repo.findExportOrder(companyId, exportOrderId);
  if (!order) throw new HttpError(400, "Selected export order was not found");
}

async function getInvoiceOrFail(companyId, id) {
  const invoice = await repo.findInvoice(companyId, id);
  if (!invoice) throw new HttpError(404, "Invoice not found");
  return invoice;
}

const pct = (current, previous) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;

function dateRanges(now) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const daysInPrevMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return {
    yearStart: new Date(Date.UTC(y, 0, 1)),
    todayEnd: new Date(Date.UTC(y, m, d, 23, 59, 59, 999)),
    prevYearStart: new Date(Date.UTC(y - 1, 0, 1)),
    prevYearEnd: new Date(Date.UTC(y - 1, m, d, 23, 59, 59, 999)),
    monthStart: new Date(Date.UTC(y, m, 1)),
    prevMonthStart: new Date(Date.UTC(y, m - 1, 1)),
    prevMonthEnd: new Date(Date.UTC(y, m - 1, Math.min(d, daysInPrevMonth), 23, 59, 59, 999)),
  };
}

export const financeService = {
  /* ---------- Summary ---------- */

  async summary(companyId, { currency: requested }) {
    const currencies = await repo.listCurrencies(companyId);
    const currency = (
      requested || (currencies.includes("USD") ? "USD" : currencies[0] || "USD")
    ).toUpperCase();

    const s = await repo.summary(companyId, currency, dateRanges(new Date()), startOfTodayUTC());
    return {
      data: {
        currency,
        currencies,
        revenueYtd: round2(s.revenueYtd),
        revenueChangePct: pct(s.revenueYtd, s.revenuePrevYtd),
        outstanding: round2(s.outstanding),
        outstandingCount: s.outstandingCount,
        overdueCount: s.overdueCount,
        expensesMtd: round2(s.expensesMtd),
        expensesChangePct: pct(s.expensesMtd, s.expensesPrevMtd),
      },
    };
  },

  /* ---------- Invoices ---------- */

  async listInvoices(companyId, query) {
    const { page, limit, sortBy, sortOrder } = query;
    const { items, total } = await repo.listInvoices({
      where: invoiceWhere(companyId, query),
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });
    return { data: items.map(invoiceDto), meta: pageMeta(page, limit, total) };
  },

  async getInvoice(companyId, id) {
    return invoiceDto(await getInvoiceOrFail(companyId, id));
  },

  async createInvoice(companyId, userId, input) {
    assertDueDate(input.issueDate, input.dueDate);
    await checkOrder(companyId, input.exportOrderId);

    // Retry if two invoices are created at the same moment and collide on invoiceNumber.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const invoiceNumber = await generateInvoiceNumber(companyId);
        const created = await repo.createInvoice({
          ...input,
          companyId,
          createdById: userId,
          invoiceNumber,
          amountPaid: 0,
          status: "PENDING",
        });
        return invoiceDto(created);
      } catch (err) {
        if (err?.code === "P2002" && attempt < 2) continue;
        throw err;
      }
    }
  },

  async updateInvoice(companyId, id, input) {
    const existing = await getInvoiceOrFail(companyId, id);
    if (existing.status !== "PENDING") {
      throw new HttpError(409, "Only pending invoices with no payments can be edited");
    }
    assertDueDate(input.issueDate ?? existing.issueDate, input.dueDate ?? existing.dueDate);
    await checkOrder(companyId, input.exportOrderId);
    return invoiceDto(await repo.updateInvoice(id, input));
  },

  async cancelInvoice(companyId, id) {
    await getInvoiceOrFail(companyId, id);
    const res = await repo.cancelInvoice(companyId, id);
    if (res.count === 0) {
      throw new HttpError(409, "Only pending invoices with no payments can be cancelled");
    }
    return invoiceDto(await getInvoiceOrFail(companyId, id));
  },

  async removeInvoice(companyId, id) {
    const existing = await getInvoiceOrFail(companyId, id);
    if (cents(existing.amountPaid) > 0) {
      throw new HttpError(409, "Invoices with recorded payments cannot be deleted");
    }
    await repo.deleteInvoice(id);
  },

  async recordPayment(companyId, userId, id, input) {
    const invoice = await getInvoiceOrFail(companyId, id);
    if (!OPEN.includes(invoice.status)) {
      throw new HttpError(409, "This invoice is not open for payment");
    }
    const balance = cents(invoice.amount) - cents(invoice.amountPaid);
    if (cents(input.amount) > balance) {
      throw new HttpError(400, `Payment exceeds the outstanding balance of ${(balance / 100).toFixed(2)}`);
    }

    try {
      const updated = await repo.recordPayment({
        invoiceId: id,
        userId,
        amount: round2(input.amount),
        method: input.method,
        paidAt: input.paidAt || new Date(),
        reference: input.reference,
        note: input.note,
      });
      return invoiceDto(updated);
    } catch (err) {
      if (err?.message === "OVERPAYMENT") {
        throw new HttpError(409, "The invoice balance changed. Refresh and try again.");
      }
      throw err;
    }
  },

  async removePayment(companyId, id, paymentId) {
    await getInvoiceOrFail(companyId, id);
    const updated = await repo.removePayment({ invoiceId: id, paymentId });
    if (!updated) throw new HttpError(404, "Payment not found");
    return invoiceDto(updated);
  },

  /* ---------- Expenses ---------- */

  async listExpenses(companyId, query) {
    const { page, limit, sortBy, sortOrder, search, category } = query;
    const where = { companyId };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { vendor: { contains: search } },
        { reference: { contains: search } },
      ];
    }
    const { items, total } = await repo.listExpenses({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });
    return { data: items.map(expenseDto), meta: pageMeta(page, limit, total) };
  },

  async createExpense(companyId, userId, input) {
    return expenseDto(await repo.createExpense({ ...input, companyId, createdById: userId }));
  },

  async updateExpense(companyId, id, input) {
    const existing = await repo.findExpense(companyId, id);
    if (!existing) throw new HttpError(404, "Expense not found");
    return expenseDto(await repo.updateExpense(id, input));
  },

  async removeExpense(companyId, id) {
    const existing = await repo.findExpense(companyId, id);
    if (!existing) throw new HttpError(404, "Expense not found");
    await repo.deleteExpense(id);
  },
};