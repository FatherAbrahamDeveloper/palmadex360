import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAccess } from "../middleware/access.middleware.js";
import * as controller from "../controllers/supplier.controller.js";
import * as applicationController from "../controllers/supplier-application.controller.js";

const router = express.Router();

router.post("/apply", applicationController.submit);

router.get("/", authenticate, requireAccess("suppliers"), controller.list);
router.get("/:id", authenticate, requireAccess("suppliers"), controller.getById);

router.post(
  "/",
  authenticate,
  requireAccess("suppliers"),
  controller.create
);

router.patch(
  "/:id",
  authenticate,
  requireAccess("suppliers"),
  controller.update
);
router.delete(
  "/:id",
  authenticate,
  requireAccess("suppliers"),
  controller.remove
);
export default router;
