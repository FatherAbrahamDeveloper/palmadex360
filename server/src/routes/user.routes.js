import { Router } from "express";
import { userController as c } from "../controllers/user.controller.js";
import { requireAccess } from "../middleware/access.middleware.js";

// Mounted behind authenticate in app.js.
const router = Router();
const view = requireAccess("access", "VIEW");
const edit = requireAccess("access", "EDIT");
const full = requireAccess("access", "FULL");

router.get("/", view, c.list);
router.get("/stats", view, c.stats);
router.post("/", edit, c.invite);
router.get("/:id", view, c.get);
router.patch("/:id", edit, c.update);
router.delete("/:id", full, c.remove);
router.post("/:id/approve", edit, c.approve);
router.post("/:id/reject", edit, c.reject);
router.post("/:id/resend-verification", edit, c.resendVerification);
router.post("/:id/mark-verified", edit, c.markVerified);
router.post("/:id/send-password-reset", edit, c.sendPasswordReset);
router.post("/:id/unlock", edit, c.unlock);
router.post("/:id/sign-out", edit, c.signOutEverywhere);
router.post("/:id/disable-2fa", full, c.disableTwoFactor);
router.get("/:id/face", view, c.face);
router.post("/:id/face/review", edit, c.reviewFace);

export default router;
