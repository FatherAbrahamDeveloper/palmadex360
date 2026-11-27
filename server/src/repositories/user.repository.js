import prisma from "../config/prisma.js";

export const findUserByEmail = (email) =>
  prisma.user.findUnique({ where: { email }, include: { company: { select: { id: true, name: true } } } });

export const findUserById = (id) =>
  prisma.user.findUnique({ where: { id }, include: { company: { select: { id: true, name: true } } } });

// Safe projection: never select passwordHash or secrets for listing endpoints.
export const SAFE_USER_FIELDS = {
  id: true,
  companyId: true,
  customerId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  organization: true,
  role: true,
  requestedRole: true,
  isActive: true,
  approvalStatus: true,
  emailVerifiedAt: true,
  twoFactorEnabled: true,
  faceStatus: true,
  faceEnrolledAt: true,
  faceReviewedAt: true,
  lastLoginAt: true,
  lockedUntil: true,
  createdAt: true,
  updatedAt: true,
  customer: { select: { id: true, name: true } },
};

export const userRepository = {
  list: ({ where, skip, take, orderBy }) =>
    prisma.$transaction([
      prisma.user.findMany({ where, select: SAFE_USER_FIELDS, skip, take, orderBy }),
      prisma.user.count({ where }),
    ]),
  findInCompany: (companyId, id) => prisma.user.findFirst({ where: { id, companyId }, select: { ...SAFE_USER_FIELDS, faceImagePath: true } }),
  update: (id, data) => prisma.user.update({ where: { id }, data, select: SAFE_USER_FIELDS }),
  create: (data) => prisma.user.create({ data, select: SAFE_USER_FIELDS }),
  countSuperAdmins: (companyId) => prisma.user.count({ where: { companyId, role: "SUPER_ADMIN", isActive: true, approvalStatus: "APPROVED" } }),
  stats: (companyId) =>
    prisma.user.groupBy({ by: ["approvalStatus"], where: { companyId }, _count: { _all: true } }),
};

// Legacy helper kept for listing.
export const listCompanyUsers = (companyId) =>
  prisma.user.findMany({ where: { companyId }, select: SAFE_USER_FIELDS, orderBy: [{ firstName: "asc" }, { lastName: "asc" }] });
