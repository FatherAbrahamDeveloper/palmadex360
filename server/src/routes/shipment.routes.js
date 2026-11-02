import { Router } from "express";
import { shipmentController } from "../controllers/shipment.controller.js";

const WRITE_ROLES = ["SUPER_ADMIN", "ADMIN", "EXPORT_MANAGER", "LOGISTICS"];
const DELETE_ROLES = ["SUPER_ADMIN", "ADMIN"];

const allow = (roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ message: "You do not have permission to do this" });

const router = Router();

router.get("/", shipmentController.list);
router.get("/:id", shipmentController.get);
router.post("/", allow(WRITE_ROLES), shipmentController.create);
router.patch("/:id", allow(WRITE_ROLES), shipmentController.update);
router.delete("/:id", allow(DELETE_ROLES), shipmentController.remove);

export default router;