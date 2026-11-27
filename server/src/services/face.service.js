import fs from "fs/promises";
import path from "path";
import prisma from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";

// Face photos are identity-verification records reviewed by an admin. They are not
// used for automated recognition or login. Stored in the database (never in a public
// folder) and only served to the account owner and to users with User & Access
// Management access.
const FACE_DIR = path.join(process.cwd(), "uploads", "faces");
const MAX_BYTES = 2 * 1024 * 1024;

export const faceEnrollmentRequired = (user) =>
  process.env.FACE_ENROLLMENT_REQUIRED !== "false" && ["NONE", "REJECTED"].includes(user.faceStatus);

function decode(dataUrl) {
  const match = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(dataUrl || "");
  if (!match) throw new HttpError(400, "Take a face photo with your camera");
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length < 5_000) throw new HttpError(400, "The photo is too small or blank. Please try again in good light.");
  if (buffer.length > MAX_BYTES) throw new HttpError(400, "The photo is too large");
  const ext = match[1] === "jpeg" ? "jpg" : match[1];
  return { buffer, ext };
}

export const faceService = {
  async save(userId, dataUrl) {
    const { buffer, ext } = decode(dataUrl);
    const mimeType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
    // Stored in the database (FaceImage) so the photo survives server restarts.
    const [, user] = await prisma.$transaction([
      prisma.faceImage.upsert({
        where: { userId },
        create: { userId, data: buffer, mimeType },
        update: { data: buffer, mimeType, createdAt: new Date() },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { faceImagePath: "db", faceStatus: "PENDING", faceEnrolledAt: new Date(), faceReviewedAt: null, faceReviewedById: null },
        select: { id: true, faceStatus: true, faceEnrolledAt: true },
      }),
    ]);
    return user;
  },

  // The photo for a user: { data, mimeType } or null. Falls back to photos saved on
  // disk by older versions.
  async load(userId, faceImagePath) {
    if (!faceImagePath) return null;
    const row = await prisma.faceImage.findUnique({ where: { userId } });
    if (row) return { data: Buffer.from(row.data), mimeType: row.mimeType };
    const file = path.join(FACE_DIR, path.basename(faceImagePath));
    try {
      const data = await fs.readFile(file);
      const ext = path.extname(file).slice(1).toLowerCase();
      return { data, mimeType: ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg" };
    } catch {
      return null;
    }
  },

  async review(reviewer, userId, decision) {
    if (!["APPROVED", "REJECTED"].includes(decision)) throw new HttpError(400, "Decision must be APPROVED or REJECTED");
    const target = await prisma.user.findFirst({ where: { id: userId, companyId: reviewer.companyId } });
    if (!target) throw new HttpError(404, "User not found");
    if (!target.faceImagePath) throw new HttpError(400, "This user has not registered a face photo yet");
    return prisma.user.update({
      where: { id: userId },
      data: { faceStatus: decision, faceReviewedAt: new Date(), faceReviewedById: reviewer.id },
      select: { id: true, faceStatus: true, faceReviewedAt: true },
    });
  },
};
