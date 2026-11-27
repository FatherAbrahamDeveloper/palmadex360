import { ZodError } from "zod";

export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Single place that turns errors into HTTP responses. Internals are logged, never sent.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return;

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: err.issues[0]?.message || "Validation failed",
      errors: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
  }

  const status = err?.status || err?.statusCode;
  if (status && status >= 400 && status < 500) {
    return res.status(status).json({
      message: err.message,
      ...(err.publicCode ? { code: err.publicCode } : {}),
      ...(err.details ? { errors: err.details } : {}),
    });
  }

  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body is not valid JSON" });
  }
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: `File is too large (limit ${process.env.MAX_UPLOAD_MB || 15} MB)` });
  }
  if (err?.code === "P2002") return res.status(409).json({ message: "A record with these details already exists" });
  if (err?.code === "P2003") return res.status(400).json({ message: "A linked record was not found" });
  if (err?.code === "P2025") return res.status(404).json({ message: "Record not found" });
  if (err?.message === "Not allowed by CORS") return res.status(403).json({ message: "Origin not allowed" });

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
  return res.status(500).json({ message: "Something went wrong. Please try again." });
};
