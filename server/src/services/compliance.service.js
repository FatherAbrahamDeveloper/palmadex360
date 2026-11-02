import { complianceRepository as repo } from "../repositories/compliance.repository.js";
import { HttpError } from "./product.service.js";

const pageMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

const fullName = (user) =>
  user
    ? {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
      }
    : null;

const fileDto = (file) => ({
  id: file.id,
  originalName: file.originalName,
  mimeType: file.mimeType,
  size: file.size,
  url: `/api/v1/files/${encodeURIComponent(file.id)}/content`,
  createdAt: file.createdAt,
});

const documentDto = (doc) => ({
  id: doc.id,
  fileId: doc.fileId,
  file: fileDto(doc.file),
  status: doc.status,
  expiryDate: doc.expiryDate,
  verifiedAt: doc.verifiedAt,
  verifiedBy: fullName(doc.verifiedBy),
  notes: doc.notes,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const historyDto = (item) => ({
  id: item.id,
  action: item.action,
  details: item.details,
  previousStatus: item.previousStatus,
  newStatus: item.newStatus,
  user: fullName(item.user),
  createdAt: item.createdAt,
});

const requirementDto = (item, detailed = false) => {
  const documents = item.documents || [];

  return {
    id: item.id,
    title: item.title,
    region: item.region,
    authority: item.authority,
    description: item.description,
    status: item.status,
    riskLevel: item.riskLevel,
    completion: item.completion,
    assignedTo: fullName(item.assignedTo),
    createdBy: fullName(item.createdBy),
    dueDate: item.dueDate,
    expiryDate: item.expiryDate,
    notes: item.notes,

    documentCount:
      item._count?.documents ?? documents.length,

    verifiedDocumentCount: documents.filter(
      (d) => d.status === "VERIFIED"
    ).length,

    createdAt: item.createdAt,
    updatedAt: item.updatedAt,

    ...(detailed && {
      documents: documents.map(documentDto),
      history: (item.history || []).map(historyDto),
    }),
  };
};

async function getRequirementOrFail(companyId, id) {
  const item = await repo.find(companyId, id);

  if (!item) {
    throw new HttpError(404, "Compliance requirement not found");
  }

  return item;
}

async function validateAssignee(companyId, assignedToId) {
  if (assignedToId === undefined || assignedToId === null) return;

  const user = await repo.findCompanyUser(companyId, assignedToId);

  if (!user) {
    throw new HttpError(
      400,
      "Selected responsible officer does not belong to your company or is inactive"
    );
  }
}

function buildWhere(companyId, query) {
  const where = { companyId };

  if (query.status) where.status = query.status;
  if (query.riskLevel) where.riskLevel = query.riskLevel;

  if (query.region) {
    where.region = { contains: query.region };
  }

  if (query.authority) {
    where.authority = { contains: query.authority };
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search } },
      { region: { contains: query.search } },
      { authority: { contains: query.search } },
      { description: { contains: query.search } },
    ];
  }

  return where;
}

export const complianceService = {
  async list(companyId, query) {
    const { page, limit, sortBy, sortOrder } = query;

    const { items, total } = await repo.list({
      where: buildWhere(companyId, query),
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    return {
      data: items.map((item) => requirementDto(item)),
      meta: pageMeta(page, limit, total),
    };
  },

  async get(companyId, id) {
    const item = await getRequirementOrFail(companyId, id);

    return requirementDto(item, true);
  },

 async create(companyId, userId, input) {
  await validateAssignee(companyId, input.assignedToId);

  const created = await repo.create({
    ...input,
    companyId,
    createdById: userId,
    completion: input.completion ?? 0,
  });

  return requirementDto(created);
},

async update(companyId, id, userId, input) {
  const existing = await getRequirementOrFail(companyId, id);

  await validateAssignee(companyId, input.assignedToId);

  const data = { ...input };

  const updated = await repo.update(
    companyId,
    id,
    data,
    userId
  );

  if (!updated) {
    throw new HttpError(404, "Compliance requirement not found");
  }

  return requirementDto(updated);
},

  async remove(companyId, id) {
    await getRequirementOrFail(companyId, id);

    const result = await repo.delete(companyId, id);

    if (!result.count) {
      throw new HttpError(404, "Compliance requirement not found");
    }
  },

  async history(companyId, id) {
    await getRequirementOrFail(companyId, id);

    const items = await repo.history(companyId, id);

    return {
      data: items.map(historyDto),
    };
  },

  async attachDocument(companyId, userId, requirementId, input) {
    await getRequirementOrFail(companyId, requirementId);

    try {
      const document = await repo.attachDocument({
        companyId,
        requirementId,
        fileId: input.fileId,
        userId,
        expiryDate: input.expiryDate,
        notes: input.notes,
      });

      if (!document) {
        throw new HttpError(
          404,
          "Uploaded file not found or does not belong to your company"
        );
      }

      return documentDto(document);
    } catch (err) {
      if (err?.code === "P2002") {
        throw new HttpError(
          409,
          "This document is already attached to this requirement"
        );
      }

      throw err;
    }
  },

  async updateDocument(
    companyId,
    userId,
    requirementId,
    documentId,
    input
  ) {
    await getRequirementOrFail(companyId, requirementId);

    const existing = await repo.findDocument(
      companyId,
      requirementId,
      documentId
    );

    if (!existing) {
      throw new HttpError(404, "Compliance document not found");
    }

    const updated = await repo.updateDocument({
      companyId,
      requirementId,
      documentId,
      userId,
      data: input,
    });

    return documentDto(updated);
  },

  async removeDocument(companyId, userId, requirementId, documentId) {
    await getRequirementOrFail(companyId, requirementId);

    const removed = await repo.removeDocument({
      companyId,
      requirementId,
      documentId,
      userId,
    });

    if (!removed) {
      throw new HttpError(404, "Compliance document not found");
    }
  },
};