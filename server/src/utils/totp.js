import crypto from "crypto";

// RFC 6238 time-based one-time passwords (Google Authenticator, Microsoft Authenticator).
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export const generateSecret = (bytes = 20) => {
  const buf = crypto.randomBytes(bytes);
  let bits = "";
  for (const b of buf) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) out += ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  return out;
};

const base32Decode = (secret) => {
  const clean = secret.replace(/=+$/, "").toUpperCase().replace(/\s/g, "");
  let bits = "";
  for (const c of clean) {
    const v = ALPHABET.indexOf(c);
    if (v < 0) throw new Error("Invalid base32");
    bits += v.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
};

export const generateCode = (secret, time = Date.now(), step = 30) => {
  const counter = Math.floor(time / 1000 / step);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", base32Decode(secret)).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(code).padStart(6, "0");
};

// Accepts the current code and one step either side, to allow for clock drift.
export const verifyCode = (secret, code) => {
  const value = String(code || "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(value)) return false;
  const now = Date.now();
  return [-1, 0, 1].some((w) => {
    const expected = generateCode(secret, now + w * 30_000);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(value));
  });
};

export const otpauthUrl = ({ secret, email, issuer = "Palmadex 360" }) =>
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
