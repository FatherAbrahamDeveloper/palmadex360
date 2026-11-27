import { permissionService } from "../services/permission.service.js";

const METHOD_LEVEL = { GET: "VIEW", HEAD: "VIEW", OPTIONS: "VIEW", POST: "EDIT", PUT: "EDIT", PATCH: "EDIT", DELETE: "FULL" };

// requireAccess("orders") checks by HTTP method: reads need VIEW, writes EDIT, deletes FULL.
// requireAccess("support", "EDIT") forces a specific level.
export const requireAccess = (module, level) => async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Authentication required" });
    const needed = level || METHOD_LEVEL[req.method] || "FULL";
    if (await permissionService.can(req.user, module, needed)) return next();
    return res.status(403).json({ message: "You do not have permission to do this" });
  } catch (err) {
    next(err);
  }
};

// Blocks customer accounts from internal-only endpoints even if a permission is misconfigured.
export const internalOnly = (req, res, next) =>
  req.user?.role === "CUSTOMER"
    ? res.status(403).json({ message: "This area is for Palmadex staff only" })
    : next();
