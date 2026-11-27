import prisma from "../config/prisma.js";
import { userRepository as repo, SAFE_USER_FIELDS } from "../repositories/user.repository.js";
import { HttpError } from "../utils/httpError.js";
import { hashPassword } from "../utils/password.js";
import { createRawToken } from "../utils/tokens.js";
import { tokenService } from "./token.service.js";
import { sendMail, appUrl } from "./mail.service.js";
import { notificationService } from "./notification.service.js";
import { activityService } from "./activity.service.js";
import { faceService } from "./face.service.js";
import { ROLES } from "../config/access.js";

const PRIVILEGED = ["SUPER_ADMIN", "ADMIN"];
const roleLabel = (id) => ROLES.find((r) => r.id === id)?.label || id;
const fullName = (u) => `${u.firstName} ${u.lastName}`.trim();

const toDto = (u) => ({
  ...u,
  emailVerified: !!u.emailVerifiedAt,
  locked: !!(u.lockedUntil && new Date(u.lockedUntil) > new Date()),
  status: u.approvalStatus !== "APPROVED" ? u.approvalStatus : u.isActive ? "ACTIVE" : "INACTIVE",
});

function buildWhere(companyId, { q, role, status }) {
  const where = { companyId };
  if (role) where.role = role;
  if (status === "PENDING") where.approvalStatus = "PENDING";
  else if (status === "REJECTED") where.approvalStatus = "REJECTED";
  else if (status === "ACTIVE") Object.assign(where, { approvalStatus: "APPROVED", isActive: true });
  else if (status === "INACTIVE") Object.assign(where, { approvalStatus: "APPROVED", isActive: false });
  else if (status === "FACE_PENDING") where.faceStatus = "PENDING";
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } }, { organization: { contains: q, mode: "insensitive" } }, { phone: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

// Who may change whom. Keeps at least one Super Admin and stops privilege escalation.
async function assertCanManage(actor, target, { newRole, deactivate } = {}) {
  if (target.id === actor.id && (newRole || deactivate)) {
    throw new HttpError(400, "You cannot change your own role or deactivate your own account");
  }
  if (actor.role !== "SUPER_ADMIN") {
    if (PRIVILEGED.includes(target.role)) throw new HttpError(403, "Only a Super Admin can change administrators");
    if (newRole && PRIVILEGED.includes(newRole)) throw new HttpError(403, "Only a Super Admin can assign administrator roles");
  }
  const losingSuperAdmin = target.role === "SUPER_ADMIN" && ((newRole && newRole !== "SUPER_ADMIN") || deactivate);
  if (losingSuperAdmin && (await repo.countSuperAdmins(actor.companyId)) <= 1) {
    throw new HttpError(400, "There must always be at least one active Super Admin");
  }
}

async function getTarget(actor, id) {
  const user = await repo.findInCompany(actor.companyId, id);
  if (!user) throw new HttpError(404, "User not found");
  return user;
}

// Customers must be linked to a Customer record so the portal knows whose orders to show.
async function resolveCustomerLink(companyId, target, { role, customerId, newCustomerName }) {
  if (role !== "CUSTOMER") return customerId === undefined ? undefined : customerId;
  if (customerId) {
    const c = await prisma.customer.findFirst({ where: { id: customerId, companyId } });
    if (!c) throw new HttpError(400, "Selected customer was not found");
    return c.id;
  }
  if (target.customerId) return target.customerId;
  const created = await prisma.customer.create({
    data: {
      companyId,
      name: newCustomerName || target.organization || fullName(target),
      email: target.email,
      phone: target.phone || null,
    },
  });
  return created.id;
}

export const userService = {
  async list(companyId, query) {
    const { page = 1, limit = 25 } = query;
    const [items, total] = await repo.list({
      where: buildWhere(companyId, query),
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ approvalStatus: "desc" }, { createdAt: "desc" }],
    });
    return { data: items.map(toDto), meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  },

  async stats(companyId) {
    const [total, pending, active, inactive, facePending, byRole] = await Promise.all([
      prisma.user.count({ where: { companyId } }),
      prisma.user.count({ where: { companyId, approvalStatus: "PENDING" } }),
      prisma.user.count({ where: { companyId, approvalStatus: "APPROVED", isActive: true } }),
      prisma.user.count({ where: { companyId, approvalStatus: "APPROVED", isActive: false } }),
      prisma.user.count({ where: { companyId, faceStatus: "PENDING" } }),
      prisma.user.groupBy({ by: ["role"], where: { companyId }, _count: { _all: true } }),
    ]);
    return {
      total, pending, active, inactive, facePending,
      byRole: Object.fromEntries(byRole.map((r) => [r.role, r._count._all])),
    };
  },

  async get(actor, id) {
    const { faceImagePath, ...user } = await getTarget(actor, id);
    return toDto({ ...user, hasFacePhoto: !!faceImagePath });
  },

  // Admin creates an account and the person sets their own password from an invitation email.
  async invite(actor, input) {
    if (await prisma.user.findUnique({ where: { email: input.email } })) {
      throw new HttpError(409, "An account with this email already exists");
    }
    await assertCanManage(actor, { id: null, role: "VIEWER" }, { newRole: input.role });
    const placeholder = { ...input, organization: input.organization || null };
    const customerId = await resolveCustomerLink(actor.companyId, placeholder, input);

    const user = await repo.create({
      companyId: actor.companyId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone || null,
      organization: input.organization || null,
      role: input.role,
      customerId: customerId || null,
      approvalStatus: "APPROVED",
      passwordHash: await hashPassword(createRawToken()), // unusable until they set one
    });

    const raw = await tokenService.issue(user.id, "INVITE");
    await sendMail({
      to: user.email,
      subject: "You have been invited to Palmadex 360",
      heading: `Hello ${user.firstName}`,
      paragraphs: [
        `${fullName(actor)} has created a Palmadex 360 account for you with the role ${roleLabel(user.role)}.`,
        "Set your password to get started. This link expires in 7 days.",
      ],
      action: { label: "Set my password", url: appUrl(`/reset-password?token=${raw}&invite=1`) },
    });
    activityService.record({ companyId: actor.companyId, userId: actor.id, action: "invited", entity: "User", entityId: user.id, label: fullName(user) });
    return toDto(user);
  },

  async update(actor, id, input) {
    const target = await getTarget(actor, id);
    const roleChanging = input.role && input.role !== target.role;
    await assertCanManage(actor, target, { newRole: roleChanging ? input.role : undefined, deactivate: input.isActive === false && target.isActive });

    const role = input.role || target.role;
    const customerId = await resolveCustomerLink(actor.companyId, target, { role, customerId: input.customerId });
    const data = {
      ...(input.firstName ? { firstName: input.firstName } : {}),
      ...(input.lastName ? { lastName: input.lastName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.organization !== undefined ? { organization: input.organization } : {}),
      ...(roleChanging ? { role } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      // Only customer accounts are linked to a Customer record.
      customerId: role === "CUSTOMER" ? customerId : null,
      // Deactivating signs the person out everywhere.
      ...(input.isActive === false ? { tokenVersion: { increment: 1 } } : {}),
    };
    const user = await repo.update(id, data);

    if (roleChanging) {
      notificationService.notify({
        userId: id, companyId: actor.companyId, title: "Your role was updated",
        message: `Your role is now ${roleLabel(role)}.`, type: "user.role", link: "/",
      });
      activityService.record({ companyId: actor.companyId, userId: actor.id, action: "changed the role of", entity: "User", entityId: id, label: fullName(user), status: role });
    }
    if (input.isActive !== undefined && input.isActive !== target.isActive) {
      activityService.record({ companyId: actor.companyId, userId: actor.id, action: input.isActive ? "reactivated" : "deactivated", entity: "User", entityId: id, label: fullName(user) });
    }
    return toDto(user);
  },

  async approve(actor, id, { role, customerId, customerName }) {
    const target = await getTarget(actor, id);
    if (target.approvalStatus === "APPROVED") throw new HttpError(400, "This account is already approved");
    await assertCanManage(actor, target, { newRole: role });
    const linkedCustomer = await resolveCustomerLink(actor.companyId, target, { role, customerId, newCustomerName: customerName });

    const user = await repo.update(id, {
      role,
      approvalStatus: "APPROVED",
      isActive: true,
      customerId: role === "CUSTOMER" ? linkedCustomer : null,
    });

    await sendMail({
      to: user.email,
      subject: "Your Palmadex 360 account is approved",
      heading: `Welcome aboard, ${user.firstName}`,
      paragraphs: [
        `Your account has been approved with the role ${roleLabel(role)}.`,
        user.emailVerifiedAt ? "You can sign in now." : "Please verify your email address first using the link we sent you, then sign in.",
      ],
      action: { label: "Sign in", url: appUrl("/login") },
    });
    activityService.record({ companyId: actor.companyId, userId: actor.id, action: "approved", entity: "User", entityId: id, label: fullName(user), status: role });
    return toDto(user);
  },

  async reject(actor, id, { reason }) {
    const target = await getTarget(actor, id);
    if (target.approvalStatus !== "PENDING") throw new HttpError(400, "Only pending registrations can be rejected");
    const user = await repo.update(id, { approvalStatus: "REJECTED", isActive: false });
    await sendMail({
      to: user.email,
      subject: "Your Palmadex 360 registration",
      heading: "Registration not approved",
      paragraphs: [
        "Thank you for registering. Unfortunately your account was not approved.",
        ...(reason ? [`Reason: ${reason}`] : []),
        "If you believe this is a mistake, please contact Palmadex.",
      ],
    });
    activityService.record({ companyId: actor.companyId, userId: actor.id, action: "rejected", entity: "User", entityId: id, label: fullName(user) });
    return toDto(user);
  },

  async remove(actor, id) {
    const target = await getTarget(actor, id);
    if (target.approvalStatus === "APPROVED") {
      throw new HttpError(400, "Approved accounts cannot be deleted. Deactivate them instead so their history is kept.");
    }
    await prisma.user.delete({ where: { id } });
  },

  async resendVerification(actor, id) {
    const target = await getTarget(actor, id);
    if (target.emailVerifiedAt) throw new HttpError(400, "This email address is already verified");
    const raw = await tokenService.issue(target.id, "EMAIL_VERIFICATION");
    await sendMail({
      to: target.email,
      subject: "Verify your email for Palmadex 360",
      heading: `Hello ${target.firstName}`,
      paragraphs: ["Please confirm your email address. This link expires in 24 hours."],
      action: { label: "Verify email", url: appUrl(`/verify-email?token=${raw}`) },
    });
    return { message: "Verification email sent" };
  },

  async markVerified(actor, id) {
    await getTarget(actor, id);
    return toDto(await repo.update(id, { emailVerifiedAt: new Date() }));
  },

  async sendPasswordReset(actor, id) {
    const target = await getTarget(actor, id);
    await assertCanManage(actor, target);
    const raw = await tokenService.issue(target.id, "PASSWORD_RESET");
    await sendMail({
      to: target.email,
      subject: "Reset your Palmadex 360 password",
      heading: "Password reset",
      paragraphs: [`An administrator sent you a password reset link. It expires in 1 hour.`],
      action: { label: "Choose a new password", url: appUrl(`/reset-password?token=${raw}`) },
    });
    return { message: "Password reset email sent" };
  },

  async unlock(actor, id) {
    await getTarget(actor, id);
    return toDto(await repo.update(id, { lockedUntil: null, failedLoginCount: 0 }));
  },

  async signOutEverywhere(actor, id) {
    const target = await getTarget(actor, id);
    await assertCanManage(actor, target);
    await repo.update(id, { tokenVersion: { increment: 1 } });
    return { message: "The user has been signed out on all devices" };
  },

  async disableTwoFactor(actor, id) {
    const target = await getTarget(actor, id);
    await assertCanManage(actor, target);
    return toDto(await repo.update(id, { twoFactorEnabled: false, twoFactorSecret: null }));
  },

  async faceFile(actor, id) {
    const target = await getTarget(actor, id);
    return faceService.load(target.id, target.faceImagePath);
  },

  async reviewFace(actor, id, { decision, note }) {
    const result = await faceService.review(actor, id, decision);
    const target = await prisma.user.findUnique({ where: { id }, select: SAFE_USER_FIELDS });
    notificationService.notify({
      userId: id, companyId: actor.companyId,
      title: decision === "APPROVED" ? "Identity verified" : "Please retake your face photo",
      message: decision === "APPROVED"
        ? "Your face photo has been verified."
        : `Your face photo could not be verified${note ? `: ${note}` : ""}. Please take a new one.`,
      type: "user.face", link: "/",
    });
    activityService.record({ companyId: actor.companyId, userId: actor.id, action: decision === "APPROVED" ? "verified the identity of" : "rejected the face photo of", entity: "User", entityId: id, label: fullName(target) });
    return { ...result };
  },
};
