
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import prisma from "../config/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

const uploadDir = path.join(
  process.cwd(),
  "uploads",
  "documents"
);

// Make sure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const name = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    const filename = `${Date.now()}-${name}${extension}`;

    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

/*
GET /api/v1/files
List files belonging to authenticated company.
*/
router.get("/", authenticate, async (req, res) => {
  try {
    const files = await prisma.file.findMany({
      where: {
        companyId: req.user.companyId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const filesWithUrls = files.map((file) => ({
      ...file,
      url: `/api/v1/files/${file.id}/content`,
    }));

    return res.json({
      success: true,
      files: filesWithUrls,
    });
  } catch (error) {
    console.error("GET FILES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load files",
    });
  }
});

/*
POST /api/v1/files/upload
Upload files for authenticated company.
*/
router.post(
  "/upload",
  authenticate,
  upload.array("files", 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      const uploadedFiles = [];

      for (const file of req.files) {
        const savedFile = await prisma.file.create({
          data: {
            companyId: req.user.companyId,
            uploadedById: req.user.id,
            originalName: file.originalname,
            storedName: file.filename,
            path: file.path,
            mimeType: file.mimetype,
            size: file.size,
          },
        });

        uploadedFiles.push({
          ...savedFile,
          url: `/api/v1/files/${savedFile.id}/content`,
        });
      }

      return res.status(201).json({
        success: true,
        message: "Files uploaded successfully",
        files: uploadedFiles,
      });
    } catch (error) {
      console.error("UPLOAD FILE ERROR:", error);

      // Clean up uploaded files if database fails
      if (req.files) {
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }

      return res.status(500).json({
        success: false,
        message: "File upload failed",
      });
    }
  }
);

/*
GET /api/v1/files/:id/content
Serve a file only if it belongs to authenticated company.
*/
/*
GET /api/v1/files/:id/content
Serve a stored file for preview or download.
*/
router.get("/:id/content", async (req, res) => {
  try {
    const file = await prisma.file.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!file?.path || !fs.existsSync(file.path)) {
      return res.status(404).json({
        message: "File not found on this server.",
      });
    }

    res.setHeader(
      "Content-Type",
      file.mimeType || "application/octet-stream"
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${path
        .basename(file.originalName || "file")
        .replace(/["\r\n]/g, "_")}"`
    );

    res.setHeader("Cache-Control", "no-cache");

    return res.sendFile(path.resolve(file.path));
  } catch (error) {
    console.error("FILE CONTENT ERROR:", error);

    return res.status(500).json({
      message: "Failed to serve file.",
    });
  }
});

/*
DELETE /api/v1/files/:id
Delete a file only if it belongs to authenticated company.
*/
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
      },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    await prisma.file.delete({
      where: {
        id: file.id,
      },
    });

    return res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("DELETE FILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete file",
    });
  }
});

export default router;
