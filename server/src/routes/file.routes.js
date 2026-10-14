import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import prisma from "../config/prisma.js";

const router = express.Router();

const uploadDir = path.join(
  process.env.HOME,
  "public_html",
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
*/
router.get("/", async (req, res) => {
  try {
    const files = await prisma.file.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const filesWithUrls = files.map((file) => ({
      ...file,
      url: `https://renamyconnect.com/uploads/documents/${file.storedName}`,
    }));

    res.json({
      success: true,
      files: filesWithUrls,
    });
  } catch (error) {
    console.error("GET FILES ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load files",
    });
  }
});

/*
POST /api/v1/files/upload
*/
// UPLOAD MULTIPLE FILES
router.post("/upload", upload.array("files", 10), async (req, res) => {
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
          originalName: file.originalname,
          storedName: file.filename,
          path: file.path,
          mimeType: file.mimetype,
          size: file.size,
        },
      });

      uploadedFiles.push({
        ...savedFile,
        url: `https://renamyconnect.com/uploads/documents/${savedFile.storedName}`,
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
});

/*
DELETE /api/v1/files/:id
*/
router.delete("/:id", async (req, res) => {
  try {
    const file = await prisma.file.findUnique({
      where: {
        id: req.params.id,
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
        id: req.params.id,
      },
    });

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("DELETE FILE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete file",
    });
  }
});

export default router