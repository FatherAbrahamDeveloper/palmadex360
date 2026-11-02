import { Router } from "express";
import { procurementController } from "../controllers/procurement.controller.js";

const WRITE_ROLES = ["SUPER_ADMIN", "ADMIN", "EXPORT_MANAGER", "LOGISTICS", "SALES"];
const DELETE_ROLES = ["SUPER_ADMIN", "ADMIN"];

const allow = (roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ message: "You do not have permission to do this" });

const router = Router();

router.get("/", procurementController.list);
router.get("/supplier-options", procurementController.supplierOptions); // keep above "/:id"
router.get("/:id", procurementController.get);
router.post("/", allow(WRITE_ROLES), procurementController.create);
router.patch("/:id", allow(WRITE_ROLES), procurementController.update);
// Approving/rejecting is further restricted to managers inside the service.
router.post("/:id/status", allow(WRITE_ROLES), procurementController.changeStatus);
router.delete("/:id", allow(DELETE_ROLES), procurementController.remove);

export default router;