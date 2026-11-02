import { Router } from "express";
import { financeController } from "../controllers/finance.controller.js";

// Finance data is sensitive, so the whole module is limited to these roles.
const FINANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "EXPORT_MANAGER"];
const DELETE_ROLES = ["SUPER_ADMIN", "ADMIN"];

const allow = (roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ message: "You do not have permission to do this" });

const router = Router();
router.use(allow(FINANCE_ROLES));

router.get("/summary", financeController.summary);

router.get("/invoices", financeController.listInvoices);
router.post("/invoices", financeController.createInvoice);
router.get("/invoices/:id", financeController.getInvoice);
router.patch("/invoices/:id", financeController.updateInvoice);
router.post("/invoices/:id/cancel", financeController.cancelInvoice);
router.delete("/invoices/:id", allow(DELETE_ROLES), financeController.removeInvoice);
router.post("/invoices/:id/payments", financeController.recordPayment);
router.delete("/invoices/:id/payments/:paymentId", allow(DELETE_ROLES), financeController.removePayment);

router.get("/expenses", financeController.listExpenses);
router.post("/expenses", financeController.createExpense);
router.patch("/expenses/:id", financeController.updateExpense);
router.delete("/expenses/:id", allow(DELETE_ROLES), financeController.removeExpense);

export default router;