import { Router } from "express";
import { communicationController as c } from "../controllers/communication.controller.js";
import { requireAccess } from "../middleware/access.middleware.js";
import { rateLimit } from "../middleware/rateLimit.middleware.js";

const router = Router();
router.use(requireAccess("communication", "VIEW"));
const write = requireAccess("communication", "EDIT");
const sendLimit = rateLimit({ windowMs: 60_000, max: 60, key: (req) => req.user.id, message: "You are sending messages too quickly." });

router.get("/directory", c.directory);
router.get("/unread", c.unread);
router.get("/conversations", c.list);
router.post("/conversations", write, c.create);
router.get("/conversations/:id", c.get);
router.patch("/conversations/:id", write, c.rename);
router.post("/conversations/:id/members", write, c.addMembers);
router.delete("/conversations/:id/members/me", c.leave);
router.get("/conversations/:id/messages", c.messages);
router.post("/conversations/:id/messages", write, sendLimit, c.send);
router.post("/conversations/:id/read", c.read);
router.patch("/messages/:messageId", write, c.edit);
router.delete("/messages/:messageId", write, c.remove);
export default router;
