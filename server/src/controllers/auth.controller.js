import fs from "fs";
import * as authService from "../services/auth.service.js";
import * as v from "../validators/auth.validator.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const ctx = (req) => ({ ip: req.ip });

export const register = asyncHandler(async (req, res) => {
  const input = v.registerSchema.parse(req.body);
  const result = await authService.register(input, ctx(req));
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  res.json(await authService.login(v.loginSchema.parse(req.body), ctx(req)));
});

export const loginTwoFactor = asyncHandler(async (req, res) => {
  res.json(await authService.loginWithTwoFactor(v.twoFactorLoginSchema.parse(req.body), ctx(req)));
});

export const verifyEmail = asyncHandler(async (req, res) => {
  res.json(await authService.verifyEmail(v.tokenSchema.parse(req.body)));
});

export const resendVerification = asyncHandler(async (req, res) => {
  res.json(await authService.resendVerification(v.emailOnlySchema.parse(req.body)));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  res.json(await authService.forgotPassword(v.emailOnlySchema.parse(req.body)));
});

export const resetPassword = asyncHandler(async (req, res) => {
  res.json(await authService.resetPassword(v.resetPasswordSchema.parse(req.body)));
});

export const me = asyncHandler(async (req, res) => {
  res.json(await authService.me(req.user));
});

export const updateProfile = asyncHandler(async (req, res) => {
  res.json(await authService.updateProfile(req.user, v.profileSchema.parse(req.body)));
});

export const changePassword = asyncHandler(async (req, res) => {
  res.json(await authService.changePassword(req.user, v.changePasswordSchema.parse(req.body)));
});

export const logoutEverywhere = asyncHandler(async (req, res) => {
  res.json(await authService.logoutEverywhere(req.user));
});

export const setupTwoFactor = asyncHandler(async (req, res) => {
  res.json(await authService.setupTwoFactor(req.user));
});

export const enableTwoFactor = asyncHandler(async (req, res) => {
  res.json(await authService.enableTwoFactor(req.user, v.twoFactorCodeSchema.parse(req.body)));
});

export const disableTwoFactor = asyncHandler(async (req, res) => {
  res.json(await authService.disableTwoFactor(req.user, v.disableTwoFactorSchema.parse(req.body)));
});

export const enrollFace = asyncHandler(async (req, res) => {
  res.json(await authService.enrollFace(req.user, v.faceImageSchema.parse(req.body)));
});

export const myFace = asyncHandler(async (req, res) => {
  const photo = await authService.faceFileFor(req.user.id);
  if (!photo) return res.status(404).json({ message: "No face photo on file" });
  res.setHeader("Content-Type", photo.mimeType);
  res.setHeader("Cache-Control", "private, no-store");
  res.send(photo.data);
});
