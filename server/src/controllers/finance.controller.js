import { ZodError } from "zod";
import { financeService } from "../services/finance.service.js";
import { HttpError } from "../services/product.service.js";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  recordPaymentSchema,
  listInvoicesQuerySchema,
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesQuerySchema,
  summaryQuerySchema,
} from "../validators/finance.validator.js";

function handleError(err, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      errors: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
  }
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err?.code === "P2002") return res.status(409).json({ message: "Could not generate a unique invoice number, please try again" });
  if (err?.code === "P2003") return res.status(400).json({ message: "Invalid export order selected" });
  return next(err);
}

const wrap = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    handleError(err, res, next);
  }
};

export const financeController = {
  summary: wrap(async (req, res) => {
    const query = summaryQuerySchema.parse(req.query);
    res.json(await financeService.summary(req.user.companyId, query));
  }),

  /* Invoices */
  listInvoices: wrap(async (req, res) => {
    const query = listInvoicesQuerySchema.parse(req.query);
    res.json(await financeService.listInvoices(req.user.companyId, query));
  }),
  getInvoice: wrap(async (req, res) => {
    res.json({ data: await financeService.getInvoice(req.user.companyId, req.params.id) });
  }),
  createInvoice: wrap(async (req, res) => {
    const input = createInvoiceSchema.parse(req.body);
    res.status(201).json({ data: await financeService.createInvoice(req.user.companyId, req.user.id, input) });
  }),
  updateInvoice: wrap(async (req, res) => {
    const input = updateInvoiceSchema.parse(req.body);
    res.json({ data: await financeService.updateInvoice(req.user.companyId, req.params.id, input) });
  }),
  cancelInvoice: wrap(async (req, res) => {
    res.json({ data: await financeService.cancelInvoice(req.user.companyId, req.params.id) });
  }),
  removeInvoice: wrap(async (req, res) => {
    await financeService.removeInvoice(req.user.companyId, req.params.id);
    res.status(204).send();
  }),
  recordPayment: wrap(async (req, res) => {
    const input = recordPaymentSchema.parse(req.body);
    res.status(201).json({
      data: await financeService.recordPayment(req.user.companyId, req.user.id, req.params.id, input),
    });
  }),
  removePayment: wrap(async (req, res) => {
    res.json({
      data: await financeService.removePayment(req.user.companyId, req.params.id, req.params.paymentId),
    });
  }),

  /* Expenses */
  listExpenses: wrap(async (req, res) => {
    const query = listExpensesQuerySchema.parse(req.query);
    res.json(await financeService.listExpenses(req.user.companyId, query));
  }),
  createExpense: wrap(async (req, res) => {
    const input = createExpenseSchema.parse(req.body);
    res.status(201).json({ data: await financeService.createExpense(req.user.companyId, req.user.id, input) });
  }),
  updateExpense: wrap(async (req, res) => {
    const input = updateExpenseSchema.parse(req.body);
    res.json({ data: await financeService.updateExpense(req.user.companyId, req.params.id, input) });
  }),
  removeExpense: wrap(async (req, res) => {
    await financeService.removeExpense(req.user.companyId, req.params.id);
    res.status(204).send();
  }),
};