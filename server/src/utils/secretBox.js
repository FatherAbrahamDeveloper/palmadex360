import crypto from "crypto";

// AES-256-GCM for small secrets at rest (two-factor keys).
const key = () => {
  const source = process.env.DATA_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!source) throw new Error("DATA_ENCRYPTION_KEY or JWT_SECRET must be set");
  return crypto.createHash("sha256").update(source).digest();
};

export const encrypt = (plain) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
};

export const decrypt = (box) => {
  const [iv, tag, data] = String(box).split(".").map((p) => Buffer.from(p, "base64url"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
};
