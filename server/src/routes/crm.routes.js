import express from "express";

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
    sendCRMContactMessage
} from "../controllers/crm.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";



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




export default router;
