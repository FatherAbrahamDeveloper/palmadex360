import { Router } from "express";
import { inventoryController } from "../controllers/inventory.controller.js";

const WRITE_ROLES = ["SUPER_ADMIN", "ADMIN", "EXPORT_MANAGER", "LOGISTICS"];
const DELETE_ROLES = ["SUPER_ADMIN", "ADMIN"];

const allow = (roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ message: "You do not have permission to do this" });

const router = Router();

router.get("/", inventoryController.list);
router.post("/", allow(WRITE_ROLES), inventoryController.create);
router.get("/:id", inventoryController.get);
router.patch("/:id", allow(WRITE_ROLES), inventoryController.update);
router.delete("/:id", allow(DELETE_ROLES), inventoryController.remove);
router.get("/:id/movements", inventoryController.movements);
router.post("/:id/movements", allow(WRITE_ROLES), inventoryController.recordMovement);

export default router;