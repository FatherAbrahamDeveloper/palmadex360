// Must be the first import: ES modules load imports before running code, so this
// makes .env values available to every module (CORS origins, SMTP, JWT) at load time.
import "dotenv/config";

import http from "http";
import app, { allowedOrigins } from "./app.js";
import { initRealtime } from "./realtime/socket.js";

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn("WARNING: JWT_SECRET is missing or shorter than 32 characters. Set a long random value in .env.");
}

const server = http.createServer(app);
initRealtime(server, { origins: allowedOrigins });

server.listen(PORT, () => {
  console.log(`Palmadex 360 API running on http://localhost:${PORT}`);
});
