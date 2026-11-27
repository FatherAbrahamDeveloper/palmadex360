import { Router } from "express";
import { complianceController } from "../controllers/compliance.controller.js";

// Access is checked by requireAccess(<module>) where this router is mounted (app.js):
// reads need VIEW, creates and updates EDIT, deletes FULL.
const router = Router();







router.get("/", complianceController.list);

router.get("/:id/history", complianceController.history);

router.get("/:id", complianceController.get);

router.post(
  "/",
  complianceController.create
);

router.patch(
  "/:id",
  complianceController.update
);

router.delete(
  "/:id",
  complianceController.remove
);

router.post(
  "/:id/documents",
  complianceController.attachDocument
);

router.patch(
  "/:id/documents/:documentId",
  complianceController.updateDocument
);

router.delete(
  "/:id/documents/:documentId",
  complianceController.removeDocument
);

export default router;
