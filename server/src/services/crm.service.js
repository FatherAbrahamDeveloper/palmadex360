import {
    findContacts,
    findContactById,
    createContact,
    updateContact,
    deleteContact,
    createStatusHistory,
    createNote,
    findNoteById,
    updateNote,
    deleteNote,
    findContactConversations,
    createContactConversation,
    createContactMessage
} from "../repositories/crm.repository.js";


export const listContacts = async ({
    companyId,
    search,
    status,
    source
}) => {

    return findContacts({
        companyId,
        search,
        status,
        source
    });

};


export const getContact = async ({
    companyId,
    contactId
}) => {

    const contact = await findContactById({
        companyId,
        contactId
    });

    if (!contact) {

        const error = new Error("Contact not found");

        error.statusCode = 404;

        throw error;

    }

    return contact;

};


export const addContact = async ({
    companyId,
    userId,
    data
}) => {

    const contact = await createContact({

        companyId,

        firstName: data.firstName || null,

        lastName: data.lastName || null,

        displayName: data.displayName.trim(),

        companyName: data.companyName || null,

        email: data.email || null,

        phone: data.phone || null,

        source: data.source || "MANUAL",

        status: data.status || "NEW",

        assignedToId: data.assignedToId || null

    });


    await createStatusHistory({

        companyId,

        contactId: contact.id,

        changedById: userId || null,

        fromStatus: null,

        toStatus: contact.status,

        note: "Contact created"

    });


    return contact;

};


export const editContact = async ({
    companyId,
    userId,
    contactId,
    data
}) => {

    const existing = await findContactById({
        companyId,
        contactId
    });

    if (!existing) {

        const error = new Error("Contact not found");

        error.statusCode = 404;

        throw error;

    }


    const updateData = {};

    const allowedFields = [
        "firstName",
        "lastName",
        "displayName",
        "companyName",
        "email",
        "phone",
        "source",
        "assignedToId"
    ];


    allowedFields.forEach((field) => {

        if (data[field] !== undefined) {

            updateData[field] = data[field];

        }

    });


    if (data.displayName) {

        updateData.displayName =
            data.displayName.trim();

    }


    if (
        data.lastContactAt !== undefined
    ) {

        updateData.lastContactAt =
            data.lastContactAt
                ? new Date(data.lastContactAt)
                : null;

    }


    if (
        data.nextFollowUpAt !== undefined
    ) {

        updateData.nextFollowUpAt =
            data.nextFollowUpAt
                ? new Date(data.nextFollowUpAt)
                : null;

    }


    if (data.status) {

        updateData.status = data.status;

    }


    await updateContact({

        companyId,

        contactId,

        data: updateData

    });


    if (
        data.status &&
        data.status !== existing.status
    ) {

        await createStatusHistory({

            companyId,

            contactId,

            changedById: userId || null,

            fromStatus: existing.status,

            toStatus: data.status,

            note: data.statusNote || null

        });

    }


    return findContactById({
        companyId,
        contactId
    });

};


export const changeStatus = async ({
    companyId,
    userId,
    contactId,
    status,
    note
}) => {

    const existing = await findContactById({
        companyId,
        contactId
    });

    if (!existing) {

        const error = new Error("Contact not found");

        error.statusCode = 404;

        throw error;

    }


    if (existing.status === status) {

        return existing;

    }


    await updateContact({

        companyId,

        contactId,

        data: {
            status
        }

    });


    await createStatusHistory({

        companyId,

        contactId,

        changedById: userId || null,

        fromStatus: existing.status,

        toStatus: status,

        note: note || null

    });


    return findContactById({
        companyId,
        contactId
    });

};


export const setFollowUp = async ({
    companyId,
    contactId,
    nextFollowUpAt
}) => {

    const existing = await findContactById({
        companyId,
        contactId
    });

    if (!existing) {

        const error = new Error("Contact not found");

        error.statusCode = 404;

        throw error;

    }


    await updateContact({

        companyId,

        contactId,

        data: {

            nextFollowUpAt:
                nextFollowUpAt
                    ? new Date(nextFollowUpAt)
                    : null

        }

    });


    return findContactById({
        companyId,
        contactId
    });

};


export const addContactNote = async ({
    companyId,
    contactId,
    authorId,
    type,
    content
}) => {

    const contact = await findContactById({
        companyId,
        contactId
    });

    if (!contact) {

        const error = new Error("Contact not found");

        error.statusCode = 404;

        throw error;

    }


    return createNote({

        companyId,

        contactId,

        authorId: authorId || null,

        type: type || "GENERAL",

        content: content.trim()

    });

};
export const editContactNote = async ({
    companyId,
    noteId,
    type,
    content
}) => {

    const existing = await findNoteById({
        companyId,
        noteId
    });

    if (!existing) {

        const error = new Error("Note not found");

        error.statusCode = 404;

        throw error;

    }


    return updateNote({
        companyId,
        noteId,
        data: {
            type: type || "GENERAL",
            content: content.trim()
        }
    });

};
export const removeContactNote = async ({
    companyId,
    noteId
}) => {

    const existing = await findNoteById({
        companyId,
        noteId
    });

    if (!existing) {

        const error = new Error("Note not found");

        error.statusCode = 404;

        throw error;

    }


    await deleteNote({
        companyId,
        noteId
    });


    return {
        success: true
    };

};



export const removeContact = async ({
    companyId,
    contactId
}) => {

    const existing = await findContactById({
        companyId,
        contactId
    });

    if (!existing) {

        const error = new Error("Contact not found");

        error.statusCode = 404;

        throw error;

    }


    await deleteContact({
        companyId,
        contactId
    });


    return {
        success: true
    };

};
export const getContactMessages = async ({
    companyId,
    contactId
}) => {
    const contact = await findContactById({
        companyId,
        contactId
    });

    if (!contact) {
        const error = new Error("Contact not found");
        error.statusCode = 404;
        throw error;
    }

    return findContactConversations({
        companyId,
        contactId
    });
};


export const sendContactMessage = async ({
    companyId,
    contactId,
    userId,
    content
}) => {
    const contact = await findContactById({
        companyId,
        contactId
    });

    if (!contact) {
        const error = new Error("Contact not found");
        error.statusCode = 404;
        throw error;
    }

    let conversation = contact.conversations?.[0];

    if (!conversation) {
        conversation = await createContactConversation({
            companyId,
            contactId,
            title: contact.displayName
        });
    }

    return createContactMessage({
        conversationId: conversation.id,
        senderId: userId,
        content: content.trim(),
        direction: "OUTBOUND",
        senderType: "USER"
    });
};
