import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { authenticate, resolveUserFromToken } from "../middleware/auth.middleware.js";
import { permissionService } from "../services/permission.service.js";
import { activityService } from "../services/activity.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { toFileDto } from "../utils/fileUrl.js";

const router = express.Router();

// Older versions saved files here; new uploads are stored in the database (FileBlob)
// so they survive restarts on hosts with temporary disks such as Render.
const legacyDir = path.join(process.cwd(), "uploads", "documents");
const MAX_FILE_MB = Number(process.env.MAX_UPLOAD_MB || 15);

const BLOCKED_EXTENSIONS = [".exe", ".bat", ".cmd", ".sh", ".msi", ".com", ".scr", ".js", ".jar", ".ps1", ".vbs", ".php", ".html", ".htm", ".svg"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(ext)) return cb(new HttpError(400, `Files of type ${ext} are not allowed`));
    cb(null, true);
  },
});

const PUBLIC_FIELDS = {
  id: true, companyId: true, uploadedById: true, productId: true, customerId: true, exportOrderId: true,
  originalName: true, mimeType: true, size: true, createdAt: true, updatedAt: true,
  uploadedBy: { select: { id: true, firstName: true, lastName: true } },
  customer: { select: { id: true, name: true } },
  exportOrder: { select: { id: true, orderNumber: true } },
};


// Can this user open this file? Checked for direct (Bearer) access.
export async function canAccessFile(user, fileId) {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: {
      exportOrder: { select: { customerId: true, companyId: true } },
      messageAttachments: { select: { message: { select: { conversationId: true } } } },
      complianceDocuments: { select: { id: true } },
    },
  });
  if (!file) return { file: null, allowed: false };
  if (file.companyId && file.companyId !== user.companyId) return { file, allowed: false };

  if (user.role === "CUSTOMER") {
    if (user.customerId && (file.customerId === user.customerId || file.exportOrder?.customerId === user.customerId)) return { file, allowed: true };
  } else {
    if (file.companyId && (await permissionService.can(user, "documents", "VIEW"))) return { file, allowed: true };
    if (file.complianceDocuments.length && (await permissionService.can(user, "compliance", "VIEW"))) return { file, allowed: true };
    if (file.productId && (await permissionService.can(user, "products", "VIEW"))) return { file, allowed: true };
  }
  if (file.uploadedById === user.id) return { file, allowed: true };

  const conversationIds = file.messageAttachments.map((a) => a.message.conversationId);
  if (conversationIds.length) {
    const member = await prisma.conversationMember.findFirst({ where: { userId: user.id, conversationId: { in: conversationIds } } });
    if (member) return { file, allowed: true };
    const crm = await prisma.conversation.findFirst({ where: { id: { in: conversationIds }, contactId: { not: null } } });
    if (crm && (await permissionService.can(user, "crm", "VIEW"))) return { file, allowed: true };
  }
  return { file, allowed: false };
}

const canUpload = async (user) => {
  for (const [module, level] of [["documents", "EDIT"], ["compliance", "EDIT"], ["communication", "EDIT"], ["support", "VIEW"], ["portal", "EDIT"]]) {
    if (await permissionService.can(user, module, level)) return true;
  }
  return false;
};

/* GET /api/v1/files — company documents, with optional filters. */
router.get("/", authenticate, asyncHandler(async (req, res) => {
  if (!(await permissionService.can(req.user, "documents", "VIEW"))) throw new HttpError(403, "You do not have permission to view documents");
  const where = { companyId: req.user.companyId };
  if (req.query.customerId) where.customerId = String(req.query.customerId);
  if (req.query.exportOrderId) where.exportOrderId = String(req.query.exportOrderId);
  const files = await prisma.file.findMany({ where, select: PUBLIC_FIELDS, orderBy: { createdAt: "desc" } });
  res.json({ success: true, files: files.map((f) => toFileDto(f, req.user.id)) });
}));

/* POST /api/v1/files/upload — optional customerId / exportOrderId share the files with a customer. */
router.post("/upload", authenticate, asyncHandler(async (req, res, next) => {
  if (!(await canUpload(req.user))) throw new HttpError(403, "You do not have permission to upload files");
  next();
}), upload.array("files", 10), asyncHandler(async (req, res) => {
  if (!req.files?.length) throw new HttpError(400, "No files uploaded");

  {
    let customerId = req.body.customerId || null;
    let exportOrderId = req.body.exportOrderId || null;
    if (req.user.role === "CUSTOMER") {
      customerId = req.user.customerId || null;
      exportOrderId = null;
    }
    if (customerId && !(await prisma.customer.findFirst({ where: { id: customerId, companyId: req.user.companyId } }))) {
      throw new HttpError(400, "Selected customer was not found");
    }
    if (exportOrderId) {
      const order = await prisma.exportOrder.findFirst({ where: { id: exportOrderId, companyId: req.user.companyId } });
      if (!order) throw new HttpError(400, "Selected order was not found");
      customerId = customerId || order.customerId;
    }

    const saved = [];
    for (const file of req.files) {
      const extension = path.extname(file.originalname).toLowerCase();
      const base = path.basename(file.originalname, extension).replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase().slice(0, 80);
      const row = await prisma.file.create({
        data: {
          companyId: req.user.companyId, uploadedById: req.user.id, customerId, exportOrderId,
          originalName: file.originalname.slice(0, 191), storedName: `${Date.now()}-${base}${extension}`, path: "database",
          mimeType: file.mimetype, size: file.size,
          blob: { create: { data: file.buffer } },
        },
        select: PUBLIC_FIELDS,
      });
      saved.push(toFileDto(row, req.user.id));
    }
    if (req.body.purpose !== "attachment") {
      activityService.record({
        companyId: req.user.companyId, userId: req.user.id, action: "uploaded", entity: "File", entityId: saved[0].id,
        summary: saved.length === 1 ? `uploaded ${saved[0].originalName}` : `uploaded ${saved.length} documents`,
      });
    }
    res.status(201).json({ success: true, message: "Files uploaded successfully", files: saved });
  }
}));

/* PATCH /api/v1/files/:id — share with a customer or link to an order. */
router.patch("/:id", authenticate, asyncHandler(async (req, res) => {
  if (!(await permissionService.can(req.user, "documents", "EDIT"))) throw new HttpError(403, "You do not have permission to edit documents");
  const file = await prisma.file.findFirst({ where: { id: req.params.id, companyId: req.user.companyId } });
  if (!file) throw new HttpError(404, "File not found");
  const data = {};
  if (req.body.customerId !== undefined) data.customerId = req.body.customerId || null;
  if (req.body.exportOrderId !== undefined) data.exportOrderId = req.body.exportOrderId || null;
  if (data.customerId && !(await prisma.customer.findFirst({ where: { id: data.customerId, companyId: req.user.companyId } }))) throw new HttpError(400, "Selected customer was not found");
  if (data.exportOrderId && !(await prisma.exportOrder.findFirst({ where: { id: data.exportOrderId, companyId: req.user.companyId } }))) throw new HttpError(400, "Selected order was not found");
  const row = await prisma.file.update({ where: { id: file.id }, data, select: PUBLIC_FIELDS });
  res.json({ success: true, file: toFileDto(row, req.user.id) });
}));

/* GET /api/v1/files/:id/content — signed link (?sig=) or Bearer token. */
router.get("/:id/content", asyncHandler(async (req, res, next) => {
  let allowed = false;
  let file = null;

  if (req.query.sig) {
    try {
      const p = jwt.verify(String(req.query.sig), process.env.JWT_SECRET);
      if (p.purpose === "file" && p.fid === req.params.id) {
        allowed = true;
        file = await prisma.file.findUnique({ where: { id: req.params.id } });
      }
    } catch {
      return res.status(401).json({ message: "This file link has expired. Refresh the page and try again." });
    }
  } else {
    const header = req.headers.authorization || "";
    let user = null;
    try {
      user = header.startsWith("Bearer ") ? await resolveUserFromToken(header.slice(7).trim()) : null;
    } catch {
      user = null;
    }
    if (!user) return res.status(401).json({ message: "Authentication required" });
    ({ file, allowed } = await canAccessFile(user, req.params.id));
  }

  if (!file) return res.status(404).json({ message: "File not found" });
  if (!allowed) return res.status(403).json({ message: "You do not have access to this file" });
  const blob = await prisma.fileBlob.findUnique({ where: { fileId: file.id } });
  const diskPath = !blob && file.path && file.path !== "database" ? path.resolve(legacyDir, path.basename(file.path)) : null;
  if (!blob && !(diskPath && fs.existsSync(diskPath))) return res.status(404).json({ message: "File not found on this server." });

  const safeName = path.basename(file.originalName || "file").replace(/["\r\n]/g, "_");
  res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
  res.setHeader("Content-Disposition", `${req.query.download ? "attachment" : "inline"}; filename="${safeName}"`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-cache");
  if (blob) return res.send(Buffer.from(blob.data));
  return res.sendFile(diskPath, (err) => err && next(err));
}));

/* DELETE /api/v1/files/:id — documents FULL access, or the person who uploaded it. */
router.delete("/:id", authenticate, asyncHandler(async (req, res) => {
  const file = await prisma.file.findFirst({ where: { id: req.params.id, companyId: req.user.companyId } });
  if (!file) throw new HttpError(404, "File not found");
  const allowed = file.uploadedById === req.user.id || (await permissionService.can(req.user, "documents", "FULL"));
  if (!allowed) throw new HttpError(403, "You do not have permission to delete this file");
  await prisma.file.delete({ where: { id: file.id } });
  // The FileBlob row is removed with the file (cascade).
  activityService.record({ companyId: req.user.companyId, userId: req.user.id, action: "deleted", entity: "File", entityId: file.id, summary: `deleted ${file.originalName}` });
  res.json({ success: true, message: "File deleted successfully" });
}));

export default router;
