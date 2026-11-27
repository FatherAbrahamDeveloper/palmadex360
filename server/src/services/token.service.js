import prisma from "../config/prisma.js";
import { createRawToken, hashToken } from "../utils/tokens.js";
import { HttpError } from "../utils/httpError.js";

const LIFETIME = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000,
  PASSWORD_RESET: 60 * 60 * 1000,
  INVITE: 7 * 24 * 60 * 60 * 1000,
};

export const tokenService = {
  // Issues a fresh one-time token and retires older unused ones of the same type.
  async issue(userId, type) {
    await prisma.userToken.updateMany({ where: { userId, type, usedAt: null }, data: { usedAt: new Date() } });
    const raw = createRawToken();
    await prisma.userToken.create({
      data: { userId, type, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + LIFETIME[type]) },
    });
    return raw;
  },

  // Returns the token row if valid, otherwise throws. Does not consume it.
  async check(raw, types) {
    const row = await prisma.userToken.findUnique({ where: { tokenHash: hashToken(raw) } });
    if (!row || !types.includes(row.type) || row.usedAt || row.expiresAt < new Date()) {
      throw new HttpError(400, "This link is invalid or has expired. Please request a new one.");
    }
    return row;
  },

  consume: (id) => prisma.userToken.update({ where: { id }, data: { usedAt: new Date() } }),
};
