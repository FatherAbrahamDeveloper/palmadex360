import { Router } from "express";
import { procurementController } from "../controllers/procurement.controller.js";
import qaRoutes from "./qa.routes.js";



// Access is checked by requireAccess(<module>) where this router is mounted (app.js):
// reads need VIEW, creates and updates EDIT, deletes FULL.
const router = Router();

router.use("/qa", qaRoutes); // quality checklists; keep above "/:id"
router.get("/", procurementController.list);
router.get("/supplier-options", procurementController.supplierOptions); // keep above "/:id"
router.get("/:id", procurementController.get);
router.post("/", procurementController.create);
router.patch("/:id", procurementController.update);
// Approving/rejecting is further restricted to managers inside the service.
router.post("/:id/status", procurementController.changeStatus);
router.delete("/:id", procurementController.remove);

export default router;
