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

const app = express();

// Set FRONTEND_URLS in Railway to your actual Vercel frontend URL.
// Multiple origins can be separated by commas.
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
      // Allow requests without an Origin header, such as server-to-server calls.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(helmet());
app.use(morgan("combined"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// General API health check
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Palmadex360 API is running",
    version: "1.0.0",
  });
});

// Database health check
app.get("/api/v1/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: "Database connection is healthy",
    });
  } catch (error) {
    // Diagnostic details go to server logs, not the HTTP response.
    console.error("Database health check failed:", {
      name: error.name,
      code: error.code,
      message: error.message,
    });

    res.status(503).json({
      success: false,
      message: "Database connection unavailable",
    });
  }
});

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/files", fileRoutes);
app.use("/api/v1/crm", crmRoutes);
app.use("/api/v1/suppliers", supplierRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// Central error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed",
    });
  }

  console.error("API error:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message:
      err.status && err.status < 500
        ? err.message
        : "Internal server error",
  });
});

export default app;