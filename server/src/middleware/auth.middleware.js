import prisma from "../config/prisma.js";
import { verifyToken } from "../utils/jwt.js";
import { permissionService } from "../services/permission.service.js";

export const AUTH_USER_SELECT = {
  id: true,
  companyId: true,
  customerId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  organization: true,
  role: true,
  isActive: true,
  approvalStatus: true,
  emailVerifiedAt: true,
  tokenVersion: true,
  twoFactorEnabled: true,
  faceStatus: true,
  faceEnrolledAt: true,
  lastLoginAt: true,
  createdAt: true,
  company: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true } },
};

// Loads the user behind a token and checks the account may still be used.
export async function resolveUserFromToken(token) {
  const decoded = verifyToken(token);
  if (typeof decoded.id !== "string" || decoded.purpose) return null;

  const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: AUTH_USER_SELECT });
  if (!user || !user.isActive || user.approvalStatus !== "APPROVED") return null;
  if ((decoded.v ?? 0) !== user.tokenVersion) return null;

  user.permissions = await permissionService.forRole(user.companyId, user.role);
  if (user.role === "SUPER_ADMIN") {
    for (const k of Object.keys(user.permissions)) user.permissions[k] = "FULL";
  }
  return user;
}

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) return res.status(401).json({ message: "Authentication required" });

    const user = await resolveUserFromToken(token);
    if (!user) return res.status(401).json({ message: "Your session has ended. Please sign in again." });

    req.user = user;
    next();
  } catch (err) {
    if (["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(err.name)) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    next(err);
  }
};
