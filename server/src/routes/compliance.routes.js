import { Router } from "express";
import { complianceController } from "../controllers/compliance.controller.js";

const router = Router();

const READ_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "EXPORT_MANAGER",
  "DOCUMENTATION",
  "LOGISTICS",
  "SALES",
];

const WRITE_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "EXPORT_MANAGER",
  "DOCUMENTATION",
];

const VERIFY_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "EXPORT_MANAGER",
];

const DELETE_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
];

const allow = (roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({
        message: "You do not have permission to do this",
      });

router.use(allow(READ_ROLES));

router.get("/", complianceController.list);

router.get("/:id/history", complianceController.history);

router.get("/:id", complianceController.get);

router.post(
  "/",
  allow(WRITE_ROLES),
  complianceController.create
);

router.patch(
  "/:id",
  allow(WRITE_ROLES),
  complianceController.update
);

router.delete(
  "/:id",
  allow(DELETE_ROLES),
  complianceController.remove
);

router.post(
  "/:id/documents",
  allow(WRITE_ROLES),
  complianceController.attachDocument
);

router.patch(
  "/:id/documents/:documentId",
  allow(VERIFY_ROLES),
  complianceController.updateDocument
);

router.delete(
  "/:id/documents/:documentId",
  allow(WRITE_ROLES),
  complianceController.removeDocument
);

export default router;