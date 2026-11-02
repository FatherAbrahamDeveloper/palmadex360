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

import JSZip from "jszip";
import { createHash } from "crypto";
import prisma from "../config/prisma.js"; // Adjust to your existing Prisma client path

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


const parseWhatsAppDate = (dateText, timeText) => {
  const parts = dateText.split(/[\/.-]/).map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return null;
  }

  let [first, second, year] = parts;

  if (year < 100) {
    year += 2000;
  }

  let month;
  let day;

  // Detect US M/D/Y format when the second number
  // cannot be a month, e.g. 9/27/26.
  if (second > 12) {
    month = first;
    day = second;
  } else if (first > 12) {
    // D/M/Y format, e.g. 27/9/26.
    day = first;
    month = second;
  } else {
    // Both numbers are 12 or below, so the format
    // is ambiguous. Your supplied export is M/D/Y.
    month = first;
    day = second;
  }

  const time = timeText.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i
  );

  if (!time) return null;

  let hour = Number(time[1]);
  const minute = Number(time[2]);
  const secondTime = Number(time[3] || 0);
  const meridiem = time[4]?.toUpperCase();

  if (
    minute > 59 ||
    secondTime > 59 ||
    hour > (meridiem ? 12 : 23) ||
    hour < (meridiem ? 1 : 0)
  ) {
    return null;
  }

  if (meridiem) {
    hour = (hour % 12) + (meridiem === "PM" ? 12 : 0);
  }

  const result = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    secondTime
  );

  if (
    result.getFullYear() !== year ||
    result.getMonth() !== month - 1 ||
    result.getDate() !== day
  ) {
    return null;
  }

  return result;
};


export const importWhatsAppChat = async (req, res) => {
    try {
        const { companyId, id: userId } = req.user;
        const { id: contactId } = req.params;
        const businessIdentifier =
            req.body.businessIdentifier?.trim();

        if (!req.file) {
            return res.status(400).json({
                message: "Please upload a WhatsApp ZIP file."
            });
        }

        if (!businessIdentifier) {
            return res.status(400).json({
                message:
                    "Enter your WhatsApp business name or phone number."
            });
        }

        const contact = await prisma.cRMContact.findFirst({
            where: {
                id: contactId,
                companyId
            },
            select: {
                id: true,
                displayName: true
            }
        });

        if (!contact) {
            return res.status(404).json({
                message: "Contact not found."
            });
        }

        const zip = await JSZip.loadAsync(req.file.buffer);

        const txtFile = Object.values(zip.files).find(file =>
            !file.dir &&
            file.name.toLowerCase().endsWith(".txt")
        );

        if (!txtFile) {
            return res.status(400).json({
                message: "No WhatsApp .txt chat found in the ZIP."
            });
        }

        const chatText = await txtFile.async("string");
        console.log("TXT FILE:", txtFile.name);
console.log("TXT LENGTH:", chatText.length);

console.log(
  "FIRST 10 LINES:",
  chatText.split(/\r?\n/).slice(0, 10)
);
        console.log("WhatsApp TXT file:", txtFile.name);
console.log("WhatsApp TXT length:", chatText.length);
console.log("WhatsApp TXT preview:", chatText.slice(0, 1000));
console.log("WhatsApp TXT line count:", chatText.split(/\r?\n/).length);

        // Supports common Android/iPhone WhatsApp export formats.
      

const parsedMessages = [];
let current = null;

const lines = chatText
  .replace(/^\uFEFF/, "")
  .split(/\r?\n/);

const startPattern =
  /^\u200e?\s*\[?(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)\]?\s*[-–]\s*(.*)$/i;

for (const line of lines) {
  const match = line.match(startPattern);

  if (match) {
    const [, dateText, timeText, remainder] = match;
    const colonIndex = remainder.indexOf(":");

    if (current) {
      parsedMessages.push(current);
      current = null;
    }

    if (colonIndex === -1) {
      continue;
    }

    const sender = remainder.slice(0, colonIndex).trim();
    const content = remainder.slice(colonIndex + 1).trim();
    const createdAt = parseWhatsAppDate(dateText, timeText);

    if (createdAt && sender) {
      current = {
        sender,
        content,
        createdAt,
      };
    }
  } else if (current) {
    current.content += "\n" + line;
  }
}

if (current) {
  parsedMessages.push(current);
}

console.log("WhatsApp lines:", lines.length);
console.log("Parsed WhatsApp messages:", parsedMessages.length);
console.log("Parsed samples:", parsedMessages.slice(0, 3));


        if (!parsedMessages.length) {
            return res.status(400).json({
                message:
                    "No readable WhatsApp messages found. Your export format may differ."
            });
        }

       
const normalize = value =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

// Allow multiple business names or phone numbers,
// separated by commas.
const businessIdentifiers = businessIdentifier
  .split(",")
  .map(normalize)
  .filter(Boolean);

const messages = parsedMessages.map(msg => {
  const sender = normalize(msg.sender);

  const outgoing = businessIdentifiers.some(
    identifier =>
      sender === identifier ||
      sender.includes(identifier) ||
      identifier.includes(sender)
  );

  const externalKey = createHash("sha256")
    .update([
      companyId,
      contactId,
      msg.createdAt.toISOString(),
      sender,
      msg.content
    ].join("|"))
    .digest("hex");

  return {
    externalKey: `wa_${externalKey}`,
    content: msg.content || null,
    createdAt: msg.createdAt,
    direction: outgoing ? "OUTBOUND" : "INBOUND",
    senderType: outgoing ? "USER" : "CONTACT",
    type: "TEXT"
  };
});


        const threadKey =
            `crm-whatsapp:${companyId}:${contactId}`;

        const result = await prisma.$transaction(async tx => {
            const conversation =
                await tx.conversation.upsert({
                    where: {
                        externalThreadKey: threadKey
                    },
                    update: {},
                    create: {
                        companyId,
                        contactId,
                        channel: "WHATSAPP",
                        type: "DIRECT",
                        title: `WhatsApp - ${contact.displayName}`,
                        externalThreadKey: threadKey
                    }
                });

            const inserted = await tx.message.createMany({
                data: messages.map(msg => ({
                    ...msg,
                    conversationId: conversation.id,
                    senderId: null
                })),
                skipDuplicates: true
            });

            if (inserted.count > 0) {
                await tx.conversation.update({
                    where: { id: conversation.id },
                    data: { updatedAt: new Date() }
                });
            }

            return {
                conversationId: conversation.id,
                imported: inserted.count,
                skipped: messages.length - inserted.count
            };
        });

        return res.status(200).json({
            message: "WhatsApp chat imported successfully.",
            ...result
        });

    } catch (error) {
        console.error("WhatsApp import error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.message || "Failed to import WhatsApp chat."
        });
    }
};

export const clearWhatsAppMessages = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id: contactId } = req.params;

    // Verify that this contact belongs to the user's company.
    const contact = await prisma.cRMContact.findFirst({
      where: {
        id: contactId,
        companyId,
      },
      select: { id: true },
    });

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const conversations = await tx.conversation.findMany({
        where: {
          companyId,
          contactId,
          channel: "WHATSAPP",
        },
        select: { id: true },
      });

      const conversationIds = conversations.map(
        (conversation) => conversation.id
      );

      if (conversationIds.length === 0) {
        return { deleted: 0 };
      }

      const deleted = await tx.message.deleteMany({
        where: {
          conversationId: {
            in: conversationIds,
          },
        },
      });

      return { deleted: deleted.count };
    });

    return res.status(200).json({
      success: true,
      message: "WhatsApp messages cleared successfully.",
      deleted: result.deleted,
    });
  } catch (error) {
    console.error("Clear WhatsApp messages error:", error);

    return res.status(500).json({
      message: "Failed to clear WhatsApp messages.",
    });
  }
};


