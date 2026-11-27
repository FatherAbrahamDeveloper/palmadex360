import { Router } from "express";
import { financeController } from "../controllers/finance.controller.js";

// Access is checked by requireAccess(<module>) where this router is mounted (app.js):
// reads need VIEW, creates and updates EDIT, deletes FULL.
const router = Router();

router.get("/summary", financeController.summary);

router.get("/invoices", financeController.listInvoices);
router.post("/invoices", financeController.createInvoice);
router.get("/invoices/:id", financeController.getInvoice);
router.patch("/invoices/:id", financeController.updateInvoice);
router.post("/invoices/:id/cancel", financeController.cancelInvoice);
router.delete("/invoices/:id", financeController.removeInvoice);
router.post("/invoices/:id/payments", financeController.recordPayment);
router.delete("/invoices/:id/payments/:paymentId", financeController.removePayment);

router.get("/expenses", financeController.listExpenses);
router.post("/expenses", financeController.createExpense);
router.patch("/expenses/:id", financeController.updateExpense);
router.delete("/expenses/:id", financeController.removeExpense);

export default router;
