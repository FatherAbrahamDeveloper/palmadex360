import express from "express";
import multer from "multer";


import {
    getContacts,
    getSingleContact,
    createCRMContact,
    updateCRMContact,
    updateCRMStatus,
    updateCRMFollowUp,
    createCRMNote,
    updateCRMNote,
    deleteCRMNote,
    deleteCRMContact,
    getCRMContactMessages,
    sendCRMContactMessage,
    importWhatsAppChat,
    clearWhatsAppMessages,

} from "../controllers/crm.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
const whatsappUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const isZip =
      file.originalname.toLowerCase().endsWith(".zip");

    if (!isZip) {
      return cb(new Error("Please upload a ZIP file."));
    }

    cb(null, true);
  },
});


const router = express.Router();


router.get(
    "/contacts",
    authenticate,
    getContacts
);


router.post(
    "/contacts",
    authenticate,
    createCRMContact
);


router.get(
    "/contacts/:id",
    authenticate,
    getSingleContact
);


router.patch(
    "/contacts/:id",
    authenticate,
    updateCRMContact
);


router.delete(
    "/contacts/:id",
    authenticate,
    deleteCRMContact
);


router.patch(
    "/contacts/:id/status",
    authenticate,
    updateCRMStatus
);


router.patch(
    "/contacts/:id/follow-up",
    authenticate,
    updateCRMFollowUp
);


router.post(
    "/contacts/:id/notes",
    authenticate,
    createCRMNote
);
router.patch(
    "/notes/:noteId",
    authenticate,
    updateCRMNote
);


router.delete(
    "/notes/:noteId",
    authenticate,
    deleteCRMNote
);

router.get(
    "/contacts/:id/messages",
    authenticate,
    getCRMContactMessages
);

router.post(
    "/contacts/:id/messages",
    authenticate,
    sendCRMContactMessage
);
router.post(
  "/contacts/:id/messages/import-whatsapp",
  authenticate,
  whatsappUpload.single("file"),
  importWhatsAppChat
);
router.delete(
  "/contacts/:id/messages",
  authenticate,
  clearWhatsAppMessages
);




export default router;
