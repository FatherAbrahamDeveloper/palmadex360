import fs from "fs";
import { userService } from "../services/user.service.js";
import { permissionService } from "../services/permission.service.js";
import * as v from "../validators/user.validator.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { MODULES, ROLES, ACCESS_LEVELS } from "../config/access.js";

export const userController = {
  list: asyncHandler(async (req, res) => res.json(await userService.list(req.user.companyId, v.listUsersQuery.parse(req.query)))),
  stats: asyncHandler(async (req, res) => res.json({ data: await userService.stats(req.user.companyId) })),
  get: asyncHandler(async (req, res) => res.json({ data: await userService.get(req.user, req.params.id) })),
  invite: asyncHandler(async (req, res) => res.status(201).json({ data: await userService.invite(req.user, v.inviteUserSchema.parse(req.body)) })),
  update: asyncHandler(async (req, res) => res.json({ data: await userService.update(req.user, req.params.id, v.updateUserSchema.parse(req.body)) })),
  approve: asyncHandler(async (req, res) => res.json({ data: await userService.approve(req.user, req.params.id, v.approveUserSchema.parse(req.body)) })),
  reject: asyncHandler(async (req, res) => res.json({ data: await userService.reject(req.user, req.params.id, v.rejectUserSchema.parse(req.body || {})) })),
  remove: asyncHandler(async (req, res) => { await userService.remove(req.user, req.params.id); res.status(204).send(); }),
  resendVerification: asyncHandler(async (req, res) => res.json(await userService.resendVerification(req.user, req.params.id))),
  markVerified: asyncHandler(async (req, res) => res.json({ data: await userService.markVerified(req.user, req.params.id) })),
  sendPasswordReset: asyncHandler(async (req, res) => res.json(await userService.sendPasswordReset(req.user, req.params.id))),
  unlock: asyncHandler(async (req, res) => res.json({ data: await userService.unlock(req.user, req.params.id) })),
  signOutEverywhere: asyncHandler(async (req, res) => res.json(await userService.signOutEverywhere(req.user, req.params.id))),
  disableTwoFactor: asyncHandler(async (req, res) => res.json({ data: await userService.disableTwoFactor(req.user, req.params.id) })),
  face: asyncHandler(async (req, res) => {
    const photo = await userService.faceFile(req.user, req.params.id);
    if (!photo) return res.status(404).json({ message: "No face photo on file" });
    res.setHeader("Content-Type", photo.mimeType);
    res.setHeader("Cache-Control", "private, no-store");
    res.send(photo.data);
  }),
  reviewFace: asyncHandler(async (req, res) => res.json({ data: await userService.reviewFace(req.user, req.params.id, v.faceReviewSchema.parse(req.body)) })),
};

export const accessController = {
  meta: (req, res) => res.json({ data: { roles: ROLES, modules: MODULES, levels: ACCESS_LEVELS } }),
  matrix: asyncHandler(async (req, res) => res.json({ data: await permissionService.matrix(req.user.companyId) })),
  update: asyncHandler(async (req, res) => {
    const { changes } = v.permissionChangesSchema.parse(req.body);
    res.json({ data: await permissionService.update(req.user.companyId, changes) });
  }),
  reset: asyncHandler(async (req, res) => res.json({ data: await permissionService.reset(req.user.companyId, req.body?.role) })),
};
