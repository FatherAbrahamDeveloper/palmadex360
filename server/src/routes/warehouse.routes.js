import { Router } from "express";
import { warehouseController } from "../controllers/warehouse.controller.js";

const WRITE_ROLES = ["SUPER_ADMIN", "ADMIN", "EXPORT_MANAGER", "LOGISTICS"];
const DELETE_ROLES = ["SUPER_ADMIN", "ADMIN"];

const allow = (roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ message: "You do not have permission to do this" });

const router = Router();

router.get("/", warehouseController.list);
router.post("/", allow(WRITE_ROLES), warehouseController.create);
router.patch("/:id", allow(WRITE_ROLES), warehouseController.update);
router.delete("/:id", allow(DELETE_ROLES), warehouseController.remove);

export default router;