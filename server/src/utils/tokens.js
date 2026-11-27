import crypto from "crypto";

// Random URL-safe token. Only its SHA-256 hash is stored, so a database leak
// does not expose usable verification or reset links.
export const createRawToken = () => crypto.randomBytes(32).toString("base64url");
export const hashToken = (raw) => crypto.createHash("sha256").update(String(raw)).digest("hex");
