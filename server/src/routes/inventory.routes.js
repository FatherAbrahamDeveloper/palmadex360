import { Router } from "express";
import { inventoryController } from "../controllers/inventory.controller.js";



// Access is checked by requireAccess(<module>) where this router is mounted (app.js):
// reads need VIEW, creates and updates EDIT, deletes FULL.
const router = Router();

router.get("/", inventoryController.list);
router.post("/", inventoryController.create);
router.get("/:id", inventoryController.get);
router.patch("/:id", inventoryController.update);
router.delete("/:id", inventoryController.remove);
router.get("/:id/movements", inventoryController.movements);
router.post("/:id/movements", inventoryController.recordMovement);

export default router;
