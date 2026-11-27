import { Router } from "express";
import { knowledgeController as c } from "../controllers/knowledge.controller.js";
import { requireAccess, internalOnly } from "../middleware/access.middleware.js";

const router = Router();
router.use(requireAccess("knowledge", "VIEW"));
const edit = [internalOnly, requireAccess("knowledge", "EDIT")];
const full = [internalOnly, requireAccess("knowledge", "FULL")];

router.get("/categories", c.categories);
router.post("/categories", ...edit, c.createCategory);
router.patch("/categories/:id", ...edit, c.updateCategory);
router.delete("/categories/:id", ...full, c.removeCategory);
router.get("/articles", c.list);
router.post("/articles", ...edit, c.create);
router.get("/articles/:idOrSlug", c.get);
router.patch("/articles/:id", ...edit, c.update);
router.delete("/articles/:id", ...full, c.remove);
router.post("/articles/:id/feedback", c.feedback);
export default router;
