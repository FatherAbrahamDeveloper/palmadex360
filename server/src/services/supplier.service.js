
import prisma from "../config/prisma.js";

export async function listSuppliers({
  companyId,
  search = "",
  status,
  page = 1,
  pageSize = 20,
}) {
  const validStatuses = [
    "PENDING",
    "UNDER_REVIEW",
    "VERIFIED",
    "REJECTED",
    "MORE_INFO_REQUIRED",
  ];

  if (status && !validStatuses.includes(status)) {
    const error = new Error("Invalid supplier status.");
    error.status = 400;
    throw error;
  }

  const where = {
    companyId,
    ...(status ? { status } : {}),
    ...(search.trim()
      ? {
          OR: [
            { companyName: { contains: search.trim() } },
            { city: { contains: search.trim() } },
            { country: { contains: search.trim() } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.supplier.findMany({
      where,
      orderBy: {
        updatedAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        products: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
          },
        },
      },
    }),

    prisma.supplier.count({ where }),
  ]);

  return {
    items: items.map(({ products, ...supplier }) => ({
      ...supplier,
      productCount: products.length,
    })),

    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getSupplier({ companyId, supplierId }) {
  return prisma.supplier.findFirst({
    where: {
      id: supplierId,
      companyId,
    },
    include: {
      products: {
        orderBy: {
          createdAt: "desc",
        },
      },
      application: true,
      documents: {
        orderBy: {
          uploadedAt: "desc",
        },
      },
      verificationHistory: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          changedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });
}

export async function createSupplier({
  companyId,
  data,
}) {
  return prisma.supplier.create({
    data: {
      ...data,
      company: {
        connect: {
          id: companyId,
        },
      },
      status: "PENDING",
    },
    include: {
      products: true,
    },
  });
}

export async function updateSupplier({
  companyId,
  supplierId,
  data,
}) {
  const existing = await prisma.supplier.findFirst({
    where: {
      id: supplierId,
      companyId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return null;
  }

  return prisma.supplier.update({
    where: {
      id: existing.id,
    },
    data,
    include: {
      products: true,
    },
  });
}

export async function deleteSupplier({
  companyId,
  supplierId,
}) {
  const existing = await prisma.supplier.findFirst({
    where: {
      id: supplierId,
      companyId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    const error = new Error("Supplier not found.");
    error.code = "P2025";
    throw error;
  }

  return prisma.supplier.delete({
    where: {
      id: existing.id,
    },
  });
}
