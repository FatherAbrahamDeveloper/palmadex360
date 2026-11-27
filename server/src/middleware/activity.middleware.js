import { activityService } from "../services/activity.service.js";

const LABEL_FIELDS = [
  "orderNumber", "shipmentNumber", "invoiceNumber", "ticketNumber", "requestNumber",
  "displayName", "companyName", "name", "title", "originalName", "email",
];

const SUBPATH_ACTION = {
  payments: "recorded a payment on", movements: "recorded a stock movement for",
  status: "changed the status of", documents: "attached a document to", notes: "added a note to",
  cancel: "cancelled", verify: "verified", approve: "approved", reject: "rejected",
  import: "imported", events: "updated the timeline of",
};

const isId = (seg) => /^c[a-z0-9]{20,}$/i.test(seg) || /^\d+$/.test(seg);

// Logs successful create/update/delete requests on a router to the activity feed.
// Mount once per module: app.use("/api/v1/export-orders", authenticate, trackActivity("ExportOrder"), routes)
// `entity` may be a function of the request, for routers that hold more than one model.
export const trackActivity = (entityOrFn) => (req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();

  const originalJson = res.json.bind(res);
  let body;
  res.json = (b) => { body = b; return originalJson(b); };

  res.on("finish", () => {
    if (res.statusCode >= 400 || !req.user) return;
    const data = body?.data && !Array.isArray(body.data) ? body.data : body && !Array.isArray(body) ? body : {};
    const segments = req.path.split("/").filter(Boolean);
    const sub = [...segments].reverse().find((s) => !isId(s));
    const entityId = data?.id && !sub ? data.id : segments.find(isId) || data?.id || null;
    const label = LABEL_FIELDS.map((f) => data?.[f]).find(Boolean);

    let action;
    if (sub && SUBPATH_ACTION[sub]) action = SUBPATH_ACTION[sub];
    else if (req.method === "POST") action = "created";
    else if (req.method === "DELETE") action = "deleted";
    else if (req.body?.status && Object.keys(req.body).length <= 3) action = "changed the status of";
    else action = "updated";

    const entity = typeof entityOrFn === "function" ? entityOrFn(req) : entityOrFn;
    activityService.record({
      companyId: req.user.companyId, userId: req.user.id, action, entity, entityId,
      label: label ? String(label).slice(0, 120) : undefined,
      status: req.body?.status || data?.status, ip: req.ip,
    });
  });

  next();
};
