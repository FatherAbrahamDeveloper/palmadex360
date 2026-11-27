import { Router } from "express";
import { exportOrderController } from "../controllers/exportOrder.controller.js";



// Access is checked by requireAccess(<module>) where this router is mounted (app.js):
// reads need VIEW, creates and updates EDIT, deletes FULL.
const router = Router();

router.get("/", exportOrderController.list);
router.get("/:id", exportOrderController.get);
router.post("/", exportOrderController.create);
router.patch("/:id", exportOrderController.update);
router.delete("/:id", exportOrderController.remove);

export default router;
