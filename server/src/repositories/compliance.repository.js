import prisma from "../config/prisma.js";

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
};

const requirementInclude = {
  assignedTo: { select: userSelect },
  createdBy: { select: userSelect },
  _count: {
    select: {
      documents: true,
      history: true,
    },
  },
};

const detailInclude = {
  ...requirementInclude,
  documents: {
    orderBy: { createdAt: "desc" },
    include: {
      file: true,
      verifiedBy: { select: userSelect },
    },
  },
  history: {
    take: 30,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: userSelect },
    },
  },
};

export const complianceRepository = {
  async list({ where, skip, take, orderBy }) {
    const [items, total] = await prisma.$transaction([
      prisma.complianceRequirement.findMany({
        where,
        include: requirementInclude,
        skip,
        take,
        orderBy,
      }),
      prisma.complianceRequirement.count({ where }),
    ]);

    return { items, total };
  },

  find: (companyId, id) =>
    prisma.complianceRequirement.findFirst({
      where: { id, companyId },
      include: detailInclude,
    }),

  create: (data) =>
    prisma.$transaction(async (tx) => {
      const requirement = await tx.complianceRequirement.create({
        data,
        include: requirementInclude,
      });

      await tx.complianceHistory.create({
        data: {
          requirementId: requirement.id,
          userId: data.createdById,
          action: "CREATED",
          details: "Compliance requirement created",
          newStatus: requirement.status,
        },
      });

      return requirement;
    }),

  async update(companyId, id, data, userId) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.complianceRequirement.findFirst({
        where: { id, companyId },
      });

      if (!existing) return null;

      const updated = await tx.complianceRequirement.update({
        where: { id },
        data,
        include: requirementInclude,
      });

      const changes = [];

      if (data.status && data.status !== existing.status) {
        changes.push({
          requirementId: id,
          userId,
          action: "STATUS_CHANGED",
          details: `Status changed from ${existing.status} to ${data.status}`,
          previousStatus: existing.status,
          newStatus: data.status,
        });
      }

      if (
        data.assignedToId !== undefined &&
        data.assignedToId !== existing.assignedToId
      ) {
        changes.push({
          requirementId: id,
          userId,
          action: "ASSIGNEE_CHANGED",
          details: "Responsible officer updated",
        });
      }

      if (
        data.completion !== undefined &&
        data.completion !== existing.completion
      ) {
        changes.push({
          requirementId: id,
          userId,
          action: "PROGRESS_UPDATED",
          details: `Completion updated from ${existing.completion}% to ${data.completion}%`,
        });
      }

      const otherChanges = Object.keys(data).filter(
        (key) =>
          !["status", "assignedToId", "completion"].includes(key)
      );

      if (otherChanges.length) {
        changes.push({
          requirementId: id,
          userId,
          action: "REQUIREMENT_UPDATED",
          details: `Updated: ${otherChanges.join(", ")}`,
        });
      }

      if (changes.length) {
        await tx.complianceHistory.createMany({
          data: changes,
        });
      }

      return updated;
    });
  },

  delete: (companyId, id) =>
    prisma.complianceRequirement.deleteMany({
      where: { id, companyId },
    }),

  async history(companyId, requirementId) {
    return prisma.complianceHistory.findMany({
      where: {
        requirementId,
        requirement: { companyId },
      },
      include: {
        user: { select: userSelect },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async attachDocument({
    companyId,
    requirementId,
    fileId,
    userId,
    expiryDate,
    notes,
  }) {
    return prisma.$transaction(async (tx) => {
      const file = await tx.file.findFirst({
        where: {
          id: fileId,
          companyId,
        },
      });

      if (!file) return null;

      const requirement = await tx.complianceRequirement.findFirst({
        where: { id: requirementId, companyId },
      });

      if (!requirement) return null;

      const document = await tx.complianceDocument.create({
        data: {
          requirementId,
          fileId,
          expiryDate,
          notes,
        },
        include: {
          file: true,
          verifiedBy: { select: userSelect },
        },
      });

      await tx.complianceHistory.create({
        data: {
          requirementId,
          userId,
          action: "DOCUMENT_ATTACHED",
          details: `Document attached: ${file.originalName}`,
        },
      });

      return document;
    });
  },

  async findDocument(companyId, requirementId, documentId) {
    return prisma.complianceDocument.findFirst({
      where: {
        id: documentId,
        requirementId,
        requirement: { companyId },
      },
      include: { file: true },
    });
  },

  async updateDocument({
    companyId,
    requirementId,
    documentId,
    userId,
    data,
  }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.complianceDocument.findFirst({
        where: {
          id: documentId,
          requirementId,
          requirement: { companyId },
        },
      });

      if (!existing) return null;

      const updateData = { ...data };

      if (data.status === "VERIFIED") {
        updateData.verifiedById = userId;
        updateData.verifiedAt = new Date();
      } else if (data.status === "REJECTED" || data.status === "PENDING") {
        updateData.verifiedById = null;
        updateData.verifiedAt = null;
      }

      const updated = await tx.complianceDocument.update({
        where: { id: documentId },
        data: updateData,
        include: {
          file: true,
          verifiedBy: { select: userSelect },
        },
      });

      await tx.complianceHistory.create({
        data: {
          requirementId,
          userId,
          action: "DOCUMENT_UPDATED",
          details: `Document ${existing.fileId} updated. Status: ${updated.status}`,
        },
      });

      return updated;
    });
  },

  async removeDocument({
    companyId,
    requirementId,
    documentId,
    userId,
  }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.complianceDocument.findFirst({
        where: {
          id: documentId,
          requirementId,
          requirement: { companyId },
        },
        include: { file: true },
      });

      if (!existing) return null;

      await tx.complianceDocument.delete({
        where: { id: documentId },
      });

      await tx.complianceHistory.create({
        data: {
          requirementId,
          userId,
          action: "DOCUMENT_REMOVED",
          details: `Document removed: ${existing.file.originalName}`,
        },
      });

      // The underlying File record is intentionally retained.
      return existing;
    });
  },

  findCompanyUser: (companyId, userId) =>
    prisma.user.findFirst({
      where: {
        id: userId,
        companyId,
        isActive: true,
      },
      select: userSelect,
    }),
};