import { Router } from "express";
import { portalController as c } from "../controllers/customer.controller.js";
import { requireAccess } from "../middleware/access.middleware.js";

const router = Router();
router.use(requireAccess("portal", "VIEW"));

router.get("/summary", c.summary);
router.get("/catalog", c.catalog);
router.get("/orders", c.orders);
router.post("/orders", requireAccess("portal", "EDIT"), c.placeOrder);
router.get("/orders/:id", c.order);
router.post("/orders/:id/cancel", requireAccess("portal", "EDIT"), c.cancelOrder);
router.get("/shipments", c.shipments);
router.get("/invoices", c.invoices);
router.get("/documents", c.documents);
export default router;
