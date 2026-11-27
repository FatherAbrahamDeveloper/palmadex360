import { Router } from "express";
import { supportController as c } from "../controllers/support.controller.js";
import { requireAccess } from "../middleware/access.middleware.js";

// VIEW: raise and follow your own tickets. EDIT: support agent (all tickets, assign, notes). FULL: delete.
const router = Router();
router.use(requireAccess("support", "VIEW"));

router.get("/tickets", c.list);
router.get("/stats", c.stats);
router.get("/agents", requireAccess("support", "EDIT"), c.agents);
router.post("/tickets", c.create);
router.get("/tickets/:id", c.get);
router.post("/tickets/:id/messages", c.reply);
router.patch("/tickets/:id", requireAccess("support", "EDIT"), c.update);
router.post("/tickets/:id/close", c.close);
router.post("/tickets/:id/reopen", c.reopen);
router.delete("/tickets/:id", requireAccess("support", "FULL"), c.remove);
export default router;
