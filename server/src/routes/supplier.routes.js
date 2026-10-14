import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import * as controller from "../controllers/supplier.controller.js";
import * as applicationController from "../controllers/supplier-application.controller.js";

const router = express.Router();

router.post("/apply", applicationController.submit);

router.get("/", authenticate, controller.list);
router.get("/:id", authenticate, controller.getById);

router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN"),
  controller.create
);

router.patch(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN"),
  controller.update
);
router.delete(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN"),
  controller.remove
);
export default router;
