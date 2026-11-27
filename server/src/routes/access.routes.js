import { Router } from "express";
import { accessController as c } from "../controllers/user.controller.js";
import { requireAccess } from "../middleware/access.middleware.js";

const superAdminOnly = (req, res, next) =>
  req.user?.role === "SUPER_ADMIN" ? next() : res.status(403).json({ message: "Only a Super Admin can change permissions" });

const router = Router();
router.get("/meta", c.meta);
router.get("/permissions", requireAccess("access", "VIEW"), c.matrix);
router.put("/permissions", superAdminOnly, c.update);
router.post("/permissions/reset", superAdminOnly, c.reset);
export default router;
