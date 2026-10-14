import prismaPkg from "@prisma/client";

const {
    CRMContactStatus,
    CRMContactSource,
    CRMNoteType
} = prismaPkg;


const validStatuses = Object.values(CRMContactStatus);

const validSources = Object.values(CRMContactSource);

const validNoteTypes = Object.values(CRMNoteType);


export const validateCreateContact = (body) => {

    const errors = [];

    if (!body.displayName || !body.displayName.trim()) {

        errors.push("displayName is required");

    }

    if (
        body.status &&
        !validStatuses.includes(body.status)
    ) {

        errors.push(
            `Invalid status. Allowed values: ${validStatuses.join(", ")}`
        );

    }

    if (
        body.source &&
        !validSources.includes(body.source)
    ) {

        errors.push(
            `Invalid source. Allowed values: ${validSources.join(", ")}`
        );

    }

    return errors;

};


export const validateUpdateContact = (body) => {

    const errors = [];

    if (
        body.status &&
        !validStatuses.includes(body.status)
    ) {

        errors.push(
            `Invalid status. Allowed values: ${validStatuses.join(", ")}`
        );

    }

    if (
        body.source &&
        !validSources.includes(body.source)
    ) {

        errors.push(
            `Invalid source. Allowed values: ${validSources.join(", ")}`
        );

    }

    return errors;

};


export const validateStatus = (status) => {

    return validStatuses.includes(status);

};


export const validateNote = (body) => {

    const errors = [];

    if (!body.content || !body.content.trim()) {

        errors.push("content is required");

    }

    if (
        body.type &&
        !validNoteTypes.includes(body.type)
    ) {

        errors.push(
            `Invalid note type. Allowed values: ${validNoteTypes.join(", ")}`
        );

    }

    return errors;

};
