import { z } from "zod";

export const INVOICE_FILTERS = ["PENDING", "PARTIALLY_PAID", "OVERDUE", "PAID", "CANCELLED"];
export const PAYMENT_METHODS = ["BANK_TRANSFER", "CASH", "CHEQUE", "CARD", "OTHER"];
export const EXPENSE_CATEGORIES = [
  "PROCUREMENT", "LOGISTICS", "SALARIES", "UTILITIES", "TAXES_DUTIES", "MARKETING", "OTHER",
];
export const CURRENCIES = ["USD", "NGN", "GBP", "EUR"];

const optStr = (max) =>
  z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(max).nullable().optional());

const money = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().positive("Amount must be greater than 0").max(9999999999999)
);

const currency = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toUpperCase() : v),
  z.enum(CURRENCIES, { message: "Choose USD, NGN, GBP or EUR" }).optional()
);
/* ---------- Invoices ---------- */

const invoiceBase = z.object({
  customerName: z.string().trim().min(2, "Customer name is required").max(191),
  exportOrderId: optStr(40),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  currency,
  amount: money,
  notes: optStr(5000),
});

export const createInvoiceSchema = invoiceBase;
export const updateInvoiceSchema = invoiceBase.partial();

export const recordPaymentSchema = z.object({
  amount: money,
  method: z.enum(PAYMENT_METHODS).default("BANK_TRANSFER"),
  paidAt: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.date().optional()),
  reference: optStr(100),
  note: optStr(2000),
});

export const listInvoicesQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(INVOICE_FILTERS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["issueDate", "dueDate", "amount", "createdAt"]).default("issueDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/* ---------- Expenses ---------- */

const expenseBase = z.object({
  description: z.string().trim().min(2, "Description is required").max(191),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  vendor: optStr(191),
  amount: money,
  currency,
  expenseDate: z.coerce.date(),
  reference: optStr(100),
  notes: optStr(5000),
});

export const createExpenseSchema = expenseBase;
export const updateExpenseSchema = expenseBase.partial();

export const listExpensesQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["expenseDate", "amount", "createdAt"]).default("expenseDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/* ---------- Summary ---------- */

export const summaryQuerySchema = z.object({
  currency: z.string().trim().max(10).optional(),
});