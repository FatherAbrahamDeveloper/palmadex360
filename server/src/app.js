import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import fileRoutes from "./routes/file.routes.js";
import crmRoutes from "./routes/crm.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";



const allowedOrigins = [
  "http://localhost:5173",
  "https://renamyconnect.com",
  "https://www.renamyconnect.com",
];

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin, such as Postman/server-side requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/files", fileRoutes);
app.use("/api/v1/crm", crmRoutes);
app.use("/api/v1/suppliers", supplierRoutes);




app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Renamy Connect API is running",
    version: "1.0.0",
  });
});

export default app;