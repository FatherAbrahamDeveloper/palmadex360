import express from "express";
import * as c from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { rateLimit } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// Brute-force protection on the public endpoints.
const strict = rateLimit({ windowMs: 15 * 60_000, max: 20, message: "Too many attempts. Please wait 15 minutes and try again." });
const emailLimit = rateLimit({ windowMs: 60 * 60_000, max: 8, message: "Too many email requests. Please wait an hour and try again." });

router.post("/register", strict, c.register);
router.post("/login", strict, c.login);
router.post("/login/2fa", strict, c.loginTwoFactor);
router.post("/verify-email", strict, c.verifyEmail);
router.post("/resend-verification", emailLimit, c.resendVerification);
router.post("/forgot-password", emailLimit, c.forgotPassword);
router.post("/reset-password", strict, c.resetPassword);

router.get("/me", authenticate, c.me);
router.patch("/me", authenticate, c.updateProfile);
router.post("/change-password", authenticate, c.changePassword);
router.post("/logout-all", authenticate, c.logoutEverywhere);

router.post("/2fa/setup", authenticate, c.setupTwoFactor);
router.post("/2fa/enable", authenticate, c.enableTwoFactor);
router.post("/2fa/disable", authenticate, c.disableTwoFactor);

router.post("/face", authenticate, c.enrollFace);
router.get("/face", authenticate, c.myFace);

export default router;
