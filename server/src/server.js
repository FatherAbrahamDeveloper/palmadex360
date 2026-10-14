import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀Palmadex360 API listening on port ${PORT}`);
});

process.on("SIGTERM", () => {
  server.close(async () => {
    console.log("HTTP server closed");

    try {
      const { default: prisma } = await import("./config/prisma.js");
      await prisma.$disconnect();
    } catch (error) {
      console.error("Prisma disconnect error:", error.message);
    }

    process.exit(0);
  });
});