import {
    listContacts,
    getContact,
    addContact,
    editContact,
    changeStatus,
    setFollowUp,
    addContactNote,
    editContactNote,
    removeContactNote,
    removeContact,
    getContactMessages,
    sendContactMessage
} from "../services/crm.service.js";


import {
    validateCreateContact,
    validateUpdateContact,
    validateStatus,
    validateNote
} from "../validators/crm.validator.js";



export const getContacts = async (req, res) => {

    try {

        const contacts = await listContacts({

            companyId: req.user.companyId,

            search: req.query.search,

            status: req.query.status,

            source: req.query.source

        });


        return res.json(contacts);

    } catch (error) {

        console.error("CRM get contacts error:", error);

        return res.status(500).json({

            message: "Failed to load CRM contacts"

        });

    }

};


export const getSingleContact = async (req, res) => {

    try {

        const contact = await getContact({

            companyId: req.user.companyId,

            contactId: req.params.id

        });


        return res.json(contact);

    } catch (error) {

        console.error("CRM get contact error:", error);

        return res.status(error.statusCode || 500).json({

            message:
                error.message ||
                "Failed to load contact"

        });

    }

};


export const createCRMContact = async (req, res) => {

    try {

        const errors =
            validateCreateContact(req.body);


        if (errors.length) {

            return res.status(400).json({

                message: "Validation failed",

                errors

            });

        }


        const contact = await addContact({

            companyId: req.user.companyId,

            userId: req.user.id,

            data: req.body

        });


        return res.status(201).json(contact);

    } catch (error) {

        console.error("CRM create contact error:", error);

        return res.status(error.statusCode || 500).json({

            message:
                error.message ||
                "Failed to create contact"

        });

    }

};


export const updateCRMContact = async (req, res) => {

    try {

        const errors =
            validateUpdateContact(req.body);


        if (errors.length) {

            return res.status(400).json({

                message: "Validation failed",

                errors

            });

        }


        const contact = await editContact({

            companyId: req.user.companyId,

            userId: req.user.id,

            contactId: req.params.id,

            data: req.body

        });


        return res.json(contact);

    } catch (error) {

        console.error("CRM update contact error:", error);

        return res.status(error.statusCode || 500).json({

            message:
                error.message ||
                "Failed to update contact"

        });

    }

};


export const updateCRMStatus = async (req, res) => {

    try {

        const {
            status,
            note
        } = req.body;


        if (!validateStatus(status)) {

            return res.status(400).json({

                message: "Invalid CRM status"

            });

        }


        const contact = await changeStatus({

            companyId: req.user.companyId,

            userId: req.user.id,

            contactId: req.params.id,

            status,

            note

        });


        return res.json(contact);

    } catch (error) {

        console.error("CRM status error:", error);

        return res.status(error.statusCode || 500).json({

            message:
                error.message ||
                "Failed to update status"

        });

    }

};


export const updateCRMFollowUp = async (req, res) => {

    try {

        const contact = await setFollowUp({

            companyId: req.user.companyId,

            contactId: req.params.id,

            nextFollowUpAt:
                req.body.nextFollowUpAt

        });


        return res.json(contact);

    } catch (error) {

        console.error("CRM follow-up error:", error);

        return res.status(error.statusCode || 500).json({

            message:
                error.message ||
                "Failed to update follow-up"

        });

    }

};


export const createCRMNote = async (req, res) => {

    try {

        const errors =
            validateNote(req.body);


        if (errors.length) {

            return res.status(400).json({

                message: "Validation failed",

                errors

            });

        }


        const note = await addContactNote({

            companyId: req.user.companyId,

            contactId: req.params.id,

            authorId: req.user.id,

            type: req.body.type,

            content: req.body.content

        });


        return res.status(201).json(note);

    } catch (error) {

        console.error("CRM note error:", error);

        return res.status(error.statusCode || 500).json({

            message:
                error.message ||
                "Failed to create note"

        });

    }

};
export const updateCRMNote = async (req, res) => {

    try {

        const errors = validateNote(req.body);

        if (errors.length) {

            return res.status(400).json({
                message: "Validation failed",
                errors
            });

        }


        const note = await editContactNote({

            companyId: req.user.companyId,

            noteId: req.params.noteId,

            type: req.body.type,

            content: req.body.content

        });


        return res.json(note);

    } catch (error) {

        console.error("CRM note update error:", error);

        return res.status(error.statusCode || 500).json({

            message:
                error.message ||
                "Failed to update note"

        });

    }

};

export const deleteCRMNote = async (req, res) => {

    try {

        await removeContactNote({

            companyId: req.user.companyId,

            noteId: req.params.noteId

        });


        return res.json({

            message: "Note deleted successfully"

        });

    } catch (error) {

        console.error("CRM note delete error:", error);

        return res.status(error.statusCode || 500).json({

            message:
                error.message ||
                "Failed to delete note"

        });

    }

};




export const deleteCRMContact = async (req, res) => {

    try {

        const result = await removeContact({

            companyId: req.user.companyId,

            contactId: req.params.id

        });


        return res.json(result);

    } catch (error) {

        console.error("CRM delete contact error:", error);

        return res.status(error.statusCode || 500).json({

            message:
                error.message ||
                "Failed to delete contact"

        });

    }

};
export const getCRMContactMessages = async (req, res) => {
    try {
        const conversations = await getContactMessages({
            companyId: req.user.companyId,
            contactId: req.params.id
        });

        return res.json(conversations);

    } catch (error) {
        console.error("CRM messages error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.message || "Failed to load messages"
        });
    }
};


export const sendCRMContactMessage = async (req, res) => {
    try {
        if (!req.body.content?.trim()) {
            return res.status(400).json({
                message: "Message content is required"
            });
        }

        const message = await sendContactMessage({
            companyId: req.user.companyId,
            contactId: req.params.id,
            userId: req.user.id,
            content: req.body.content
        });

        return res.status(201).json(message);

    } catch (error) {
        console.error("CRM send message error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.message || "Failed to send message"
        });
    }
};
