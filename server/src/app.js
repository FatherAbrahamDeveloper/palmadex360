import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { authenticate } from "./middleware/auth.middleware.js";
import { requireAccess, internalOnly } from "./middleware/access.middleware.js";
import { trackActivity } from "./middleware/activity.middleware.js";
import { requireFaceEnrollment } from "./middleware/face.middleware.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { rateLimit } from "./middleware/rateLimit.middleware.js";

import authRoutes from "./routes/auth.routes.js";
import fileRoutes from "./routes/file.routes.js";
import crmRoutes from "./routes/crm.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";
import productRoutes from "./routes/product.routes.js";
import exportOrderRoutes from "./routes/exportOrder.routes.js";
import shipmentRoutes from "./routes/shipment.routes.js";
import warehouseRoutes from "./routes/warehouse.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import procurementRoutes from "./routes/procurement.routes.js";
import financeRoutes from "./routes/finance.routes.js";
import complianceRoutes from "./routes/compliance.routes.js";
import globalSearchRoutes from "./routes/globalSearch.routes.js";
import userRoutes from "./routes/user.routes.js";
import accessRoutes from "./routes/access.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import portalRoutes from "./routes/portal.routes.js";
import communicationRoutes from "./routes/communication.routes.js";
import supportRoutes from "./routes/support.routes.js";
import knowledgeRoutes from "./routes/knowledge.routes.js";
import { dashboardRoutes, activityRoutes, notificationRoutes, reportRoutes } from "./routes/insights.routes.js";

export const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://palmadex360.vercel.app",
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean) : []),
];

const app = express();

// Render (like most hosts) runs the app behind a proxy; this makes req.ip the real client address for rate limiting.
app.set("trust proxy", 1);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin, such as Postman/server-side requests
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "frame-ancestors": ["'self'", ...allowedOrigins],
      },
    },
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
// Face photos are sent as base64 during sign-up, so allow a few MB.
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ success: true, message: "Palmadex 360 API is running", version: "1.1.0" });
});

// General safety net against abuse; per-route limits are stricter (auth, messaging).
app.use("/api/v1", rateLimit({ windowMs: 60_000, max: 600 }));

// Public and session routes
app.use("/api/v1/auth", authRoutes);

// Everything below needs a signed-in user who has completed face registration.
const protect = [authenticate, requireFaceEnrollment];

app.use("/api/v1/files", fileRoutes); // files do their own checks (signed links, portal sharing)
app.use("/api/v1/crm", ...protect, internalOnly, requireAccess("crm"), trackActivity("CRMContact"), crmRoutes);
app.use("/api/v1/suppliers", trackActivity("Supplier"), supplierRoutes); // public /apply lives here
app.use("/api/v1/products", ...protect, internalOnly, requireAccess("products"), trackActivity("Product"), productRoutes);
app.use("/api/v1/export-orders", ...protect, internalOnly, requireAccess("orders"), trackActivity("ExportOrder"), exportOrderRoutes);
app.use("/api/v1/shipments", ...protect, internalOnly, requireAccess("shipping"), trackActivity("Shipment"), shipmentRoutes);
app.use("/api/v1/warehouses", ...protect, internalOnly, requireAccess("inventory"), trackActivity("Warehouse"), warehouseRoutes);
app.use("/api/v1/inventory", ...protect, internalOnly, requireAccess("inventory"), trackActivity("StockLevel"), inventoryRoutes);
// Deleting a draft quality check is an everyday action: EDIT is enough for that one path.
const procurementAccess = (req, res, next) =>
  req.method === "DELETE" && req.path.startsWith("/qa/inspections/") ? requireAccess("procurement", "EDIT")(req, res, next) : requireAccess("procurement")(req, res, next);
// Quality checks log their own, more specific activity entries (qa.service.js).
const trackProcurement = (req, res, next) => (req.path.startsWith("/qa/") ? next() : trackActivity("PurchaseRequest")(req, res, next));
app.use("/api/v1/procurement", ...protect, internalOnly, procurementAccess, trackProcurement, procurementRoutes);
app.use("/api/v1/finance", ...protect, internalOnly, requireAccess("finance"), trackActivity((req) => (req.path.startsWith("/expenses") ? "Expense" : "Invoice")), financeRoutes);
app.use("/api/v1/compliance", ...protect, internalOnly, requireAccess("compliance"), trackActivity("ComplianceRequirement"), complianceRoutes);
app.use("/api/v1/customers", ...protect, trackActivity("Customer"), customerRoutes);
app.use("/api/v1/portal", ...protect, portalRoutes);
app.use("/api/v1/communication", ...protect, communicationRoutes);
app.use("/api/v1/support", ...protect, supportRoutes);
app.use("/api/v1/knowledge", ...protect, trackActivity("KnowledgeArticle"), knowledgeRoutes);
app.use("/api/v1/users", ...protect, userRoutes);
app.use("/api/v1/access", ...protect, accessRoutes);
app.use("/api/v1/search", ...protect, globalSearchRoutes);
app.use("/api/v1/dashboard", ...protect, dashboardRoutes);
app.use("/api/v1/activity", ...protect, activityRoutes);
app.use("/api/v1/notifications", authenticate, notificationRoutes);
app.use("/api/v1/reports", ...protect, reportRoutes);

app.use("/api/v1", notFoundHandler);
app.use(errorHandler);

export default app;
