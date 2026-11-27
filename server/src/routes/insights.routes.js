import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { dashboardService } from "../services/dashboard.service.js";
import { reportsService } from "../services/reports.service.js";
import { activityService } from "../services/activity.service.js";
import { notificationService } from "../services/notification.service.js";
import { requireAccess, internalOnly } from "../middleware/access.middleware.js";

// Dashboard, activity feed, notifications and reports. All mounted behind authenticate.
export const dashboardRoutes = Router()
  .get("/summary", asyncHandler(async (req, res) => res.json({ data: await dashboardService.summary(req.user) })));

export const activityRoutes = Router()
  .get("/", asyncHandler(async (req, res) => res.json({
    data: await activityService.feed(req.user, {
      limit: Math.max(1, Math.min(50, Number(req.query.limit) || 15)),
      before: req.query.before ? String(req.query.before) : undefined,
    }),
  })));

export const notificationRoutes = Router()
  .get("/", asyncHandler(async (req, res) => res.json(await notificationService.list(req.user.id, {
    unreadOnly: req.query.unread === "true",
    limit: Math.max(1, Math.min(50, Number(req.query.limit) || 20)),
    before: req.query.before ? String(req.query.before) : undefined,
  }))))
  .post("/read-all", asyncHandler(async (req, res) => { await notificationService.markAllRead(req.user.id); res.status(204).send(); }))
  .post("/:id/read", asyncHandler(async (req, res) => { await notificationService.markRead(req.user.id, req.params.id); res.status(204).send(); }));

export const reportRoutes = Router()
  .use(internalOnly, requireAccess("reports", "VIEW"))
  .get("/overview", asyncHandler(async (req, res) => res.json({ data: await reportsService.overview(req.user, req.query) })))
  .get("/monthly", asyncHandler(async (req, res) => res.json({ data: await reportsService.monthly(req.user, req.query) })))
  .get("/export", asyncHandler(async (req, res) => {
    const { filename, csv } = await reportsService.exportCsv(req.user, req.query);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  }));
