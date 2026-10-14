import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        message: "Authentication configuration error",
      });
    }

    const decoded = jwt.verify(token, secret);

    // Support the token payload used by your existing login system.
    const userId = decoded.id;

    if (typeof userId !== "string" || !userId) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        companyId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "User account is invalid or inactive",
      });
    }

    // Only expose the fields the application needs.
    req.user = user;

    next();
  } catch (err) {
    if (
      err.name === "JsonWebTokenError" ||
      err.name === "TokenExpiredError" ||
      err.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    next(err);
  }
};