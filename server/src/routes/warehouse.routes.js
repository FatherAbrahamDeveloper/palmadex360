import { Router } from "express";
import { warehouseController } from "../controllers/warehouse.controller.js";



// Access is checked by requireAccess(<module>) where this router is mounted (app.js):
// reads need VIEW, creates and updates EDIT, deletes FULL.
const router = Router();

router.get("/", warehouseController.list);
router.post("/", warehouseController.create);
router.patch("/:id", warehouseController.update);
router.delete("/:id", warehouseController.remove);

export default router;
