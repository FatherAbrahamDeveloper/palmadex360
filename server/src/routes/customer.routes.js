import { Router } from "express";
import { customerController as c } from "../controllers/customer.controller.js";
import { requireAccess, internalOnly } from "../middleware/access.middleware.js";
import { permissionService } from "../services/permission.service.js";

const router = Router();
router.use(internalOnly);

// Order, invoice and document forms all need the customer dropdown.
router.get("/options", async (req, res, next) => {
  try {
    for (const m of ["portal", "orders", "finance", "documents", "support", "crm"]) {
      if (await permissionService.can(req.user, m, "VIEW")) return next();
    }
    res.status(403).json({ message: "You do not have permission to do this" });
  } catch (err) { next(err); }
}, c.options);

router.get("/", requireAccess("portal", "VIEW"), c.list);
router.post("/", requireAccess("portal", "EDIT"), c.create);
router.get("/:id", requireAccess("portal", "VIEW"), c.get);
router.patch("/:id", requireAccess("portal", "EDIT"), c.update);
router.delete("/:id", requireAccess("portal", "FULL"), c.remove);
export default router;
