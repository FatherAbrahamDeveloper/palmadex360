import { Router } from "express";
import { exportOrderController } from "../controllers/exportOrder.controller.js";

const WRITE_ROLES = ["SUPER_ADMIN", "ADMIN", "EXPORT_MANAGER", "SALES"];
const DELETE_ROLES = ["SUPER_ADMIN", "ADMIN"];

const allow = (roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ message: "You do not have permission to do this" });

const router = Router();

router.get("/", exportOrderController.list);
router.get("/:id", exportOrderController.get);
router.post("/", allow(WRITE_ROLES), exportOrderController.create);
router.patch("/:id", allow(WRITE_ROLES), exportOrderController.update);
router.delete("/:id", allow(DELETE_ROLES), exportOrderController.remove);

export default router;