
import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import prisma from "./config/prisma.js";

import authRoutes from "./routes/auth.routes.js";
import fileRoutes from "./routes/file.routes.js";
import crmRoutes from "./routes/crm.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";

import { authenticate } from "./middleware/auth.middleware.js";

import productRoutes from "./routes/product.routes.js";
import exportOrderRoutes from "./routes/exportOrder.routes.js";
import shipmentRoutes from "./routes/shipment.routes.js";
import warehouseRoutes from "./routes/warehouse.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import procurementRoutes from "./routes/procurement.routes.js";
import financeRoutes from "./routes/finance.routes.js";
import complianceRoutes from "./routes/compliance.routes.js";
import globalSearchRoutes from "./routes/globalSearch.routes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.FRONTEND_URLS || "")
    .split(",")
    .map((url) => url.trim().replace(/\/+$/, ""))
    .filter(Boolean),
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },

    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),

        "frame-ancestors": [
          "'self'",
          "https://palmadex360.vercel.app",
        ],
      },
    },
  })
);

app.use(morgan("combined"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health checks
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Palmadex360 API is running",
    version: "1.0.0",
  });
});

app.get("/api/v1/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: "Database connection is healthy",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(503).json({
      success: false,
      message: "Database connection unavailable",
    });
  }
});

// Existing routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/files", fileRoutes);
app.use("/api/v1/crm", crmRoutes);
app.use("/api/v1/suppliers", supplierRoutes);

// Advanced modules
app.use("/api/v1/products", authenticate, productRoutes);
app.use("/api/v1/export-orders", authenticate, exportOrderRoutes);
app.use("/api/v1/shipments", authenticate, shipmentRoutes);
app.use("/api/v1/warehouses", authenticate, warehouseRoutes);
app.use("/api/v1/inventory", authenticate, inventoryRoutes);
app.use("/api/v1/procurement", authenticate, procurementRoutes);
app.use("/api/v1/finance", authenticate, financeRoutes);
app.use("/api/v1/compliance", authenticate, complianceRoutes);
app.use("/api/v1/search", globalSearchRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// Central error handler
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed",
    });
  }

  console.error("API error:", err);

  res.status(err.status || 500).json({
    success: false,
    message:
      err.status && err.status < 500
        ? err.message
        : "Internal server error",
  });
});

export default app;
