import { Router } from "express";
import { shipmentController } from "../controllers/shipment.controller.js";



// Access is checked by requireAccess(<module>) where this router is mounted (app.js):
// reads need VIEW, creates and updates EDIT, deletes FULL.
const router = Router();

router.get("/", shipmentController.list);
router.get("/:id", shipmentController.get);
router.post("/", shipmentController.create);
router.patch("/:id", shipmentController.update);
router.delete("/:id", shipmentController.remove);

export default router;
