
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolve server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Select environment file
const envFile =
  process.env.APP_ENV === "production"
    ? "env.production"
    : "env.local";

// Load environment variables BEFORE importing the app
dotenv.config({
  path: path.resolve(__dirname, "../", envFile),
  override: true,
});

// Verify configuration
console.log("Environment:", process.env.NODE_ENV);
console.log("Environment file:", envFile);
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing. Server startup aborted.");
  process.exit(1);
}

// Import app only after environment variables are loaded
const { default: app } = await import("./app.js");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Palmadex360 API listening on port ${PORT}`);
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down...`);

  server.close(async () => {
    console.log("HTTP server closed");

    try {
      const { default: prisma } = await import("./config/prisma.js");
      await prisma.$disconnect();
      console.log("Prisma disconnected successfully");
    } catch (error) {
      console.error("Prisma disconnect error:", error.message);
    }

    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
