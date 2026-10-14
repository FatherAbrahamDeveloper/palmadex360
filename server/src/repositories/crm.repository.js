import prisma from "../config/prisma.js";

export const findContacts = async ({
    companyId,
    search,
    status,
    source
}) => {

    const where = {
        companyId
    };

    if (status) {
        where.status = status;
    }

    if (source) {
        where.source = source;
    }

    if (search) {

        where.OR = [
            {
                displayName: {
                    contains: search
                }
            },
            {
                firstName: {
                    contains: search
                }
            },
            {
                lastName: {
                    contains: search
                }
            },
            {
                companyName: {
                    contains: search
                }
            },
            {
                email: {
                    contains: search
                }
            },
            {
                phone: {
                    contains: search
                }
            }
        ];

    }

    return prisma.cRMContact.findMany({

        where,

        include: {

            assignedTo: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            },

            _count: {
                select: {
                    notes: true,
                    conversations: true
                }
            }

        },

        orderBy: {
            updatedAt: "desc"
        }

    });

};


export const findContactById = async ({
    companyId,
    contactId
}) => {

    return prisma.cRMContact.findFirst({

        where: {
            id: contactId,
            companyId
        },

        include: {

            assignedTo: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            },

            notes: {

                include: {

                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    }

                },

                orderBy: {
                    createdAt: "desc"
                }

            },

            statusHistory: {

                include: {

                    changedBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    }

                },

                orderBy: {
                    createdAt: "desc"
                }

            },

            conversations: {
                orderBy: {
                    updatedAt: "desc"
                }
            },

            _count: {
                select: {
                    notes: true,
                    conversations: true
                }
            }

        }

    });

};


export const createContact = async (data) => {

    return prisma.cRMContact.create({

        data,

        include: {

            assignedTo: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            },

            _count: {
                select: {
                    notes: true,
                    conversations: true
                }
            }

        }

    });

};


export const updateContact = async ({
    companyId,
    contactId,
    data
}) => {

    return prisma.cRMContact.updateMany({

        where: {
            id: contactId,
            companyId
        },

        data

    });

};


export const deleteContact = async ({
    companyId,
    contactId
}) => {

    return prisma.cRMContact.deleteMany({

        where: {
            id: contactId,
            companyId
        }

    });

};


export const createStatusHistory = async (data) => {

    return prisma.cRMStatusHistory.create({
        data
    });

};


export const createNote = async (data) => {
    return prisma.cRMNote.create({
        data,
        include: {
            author: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                }
            }
        }
    });
};


export const findNoteById = async ({
    companyId,
    noteId
}) => {

    return prisma.cRMNote.findFirst({
        where: {
            id: noteId,
            companyId
        },
        include: {
            author: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                }
            }
        }
    });

};


export const updateNote = async ({
    companyId,
    noteId,
    data
}) => {

    const note = await prisma.cRMNote.findFirst({
        where: {
            id: noteId,
            companyId
        }
    });

    if (!note) {
        return null;
    }

    return prisma.cRMNote.update({
        where: {
            id: noteId
        },
        data,
        include: {
            author: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                }
            }
        }
    });

};


export const deleteNote = async ({
    companyId,
    noteId
}) => {

    const note = await prisma.cRMNote.findFirst({
        where: {
            id: noteId,
            companyId
        }
    });

    if (!note) {
        return null;
    }

    return prisma.cRMNote.delete({
        where: {
            id: noteId
        }
    });

};

export const getNoteById = async (id) => {
  return prisma.cRMNote.findUnique({
    where: {
      id,
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};




export const findContactConversations = async ({
    companyId,
    contactId
}) => {
    return prisma.conversation.findMany({
        where: {
            companyId,
            contactId
        },
        include: {
            messages: {
                where: {
                    isDeleted: false
                },
                orderBy: {
                    createdAt: "asc"
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    attachments: {
                        include: {
                            file: true
                        }
                    }
                }
            }
        },
        orderBy: {
            updatedAt: "desc"
        }
    });
};

export const createContactConversation = async ({
    companyId,
    contactId,
    title
}) => {
    return prisma.conversation.create({
        data: {
            companyId,
            contactId,
            type: "DIRECT",
            channel: "INTERNAL",
            title: title || null
        }
    });
};

export const createContactMessage = async ({
    conversationId,
    senderId,
    content,
    direction = "OUTBOUND",
    senderType = "USER"
}) => {
    return prisma.message.create({
        data: {
            conversationId,
            senderId,
            content,
            direction,
            senderType,
            type: "TEXT"
        },
        include: {
            sender: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        }
    });
};

