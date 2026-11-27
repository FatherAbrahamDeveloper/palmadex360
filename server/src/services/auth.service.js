import prisma from "../config/prisma.js";
import { findUserByEmail } from "../repositories/user.repository.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken, generateChallengeToken, verifyChallengeToken } from "../utils/jwt.js";
import { HttpError } from "../utils/httpError.js";
import { encrypt, decrypt } from "../utils/secretBox.js";
import { generateSecret, verifyCode, otpauthUrl } from "../utils/totp.js";
import { tokenService } from "./token.service.js";
import { sendMail, appUrl } from "./mail.service.js";
import { notificationService } from "./notification.service.js";
import { activityService } from "./activity.service.js";
import { permissionService } from "./permission.service.js";
import { faceService, faceEnrollmentRequired } from "./face.service.js";
import { AUTH_USER_SELECT } from "../middleware/auth.middleware.js";

// A valid bcrypt hash of a random value. Comparing against it when the email does
// not exist makes "unknown email" take as long as "wrong password".
const DUMMY_HASH = "$2b$10$TDC70QgMvqAiSskVGlfni.75/O/8qijTp48za8xWqCAypdz3c5IEm";

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

const fullName = (u) => `${u.firstName} ${u.lastName}`.trim();

// The only user fields that ever leave the API. Never includes passwordHash or secrets.
export const toSafeUser = (user, permissions) => ({
  id: user.id,
  companyId: user.companyId,
  customerId: user.customerId ?? null,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone ?? null,
  organization: user.organization ?? null,
  role: user.role,
  isActive: user.isActive,
  approvalStatus: user.approvalStatus,
  emailVerified: !!user.emailVerifiedAt,
  twoFactorEnabled: !!user.twoFactorEnabled,
  faceStatus: user.faceStatus,
  faceEnrollmentRequired: faceEnrollmentRequired(user),
  lastLoginAt: user.lastLoginAt ?? null,
  createdAt: user.createdAt,
  company: user.company ? { id: user.company.id, name: user.company.name } : null,
  customer: user.customer ? { id: user.customer.id, name: user.customer.name } : null,
  permissions: permissions || user.permissions || {},
});

async function sessionFor(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: AUTH_USER_SELECT });
  let permissions = await permissionService.forRole(user.companyId, user.role);
  if (user.role === "SUPER_ADMIN") permissions = Object.fromEntries(Object.keys(permissions).map((k) => [k, "FULL"]));
  return { token: generateToken(user), user: toSafeUser(user, permissions) };
}

// The company new sign-ups join. Palmadex runs one company; override with DEFAULT_COMPANY_ID.
async function resolveSignupCompany(organization) {
  const id = process.env.DEFAULT_COMPANY_ID || process.env.SUPPLIER_APPLICATION_COMPANY_ID;
  if (id) {
    const company = await prisma.company.findUnique({ where: { id } });
    if (company) return company;
  }
  const first = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });
  if (first) return first;
  return prisma.company.create({ data: { name: organization || "Palmadex Global Integrated Services Ltd" } });
}

async function sendVerificationEmail(user) {
  const raw = await tokenService.issue(user.id, "EMAIL_VERIFICATION");
  return sendMail({
    to: user.email,
    subject: "Verify your email for Palmadex 360",
    heading: `Welcome, ${user.firstName}`,
    paragraphs: [
      "Please confirm your email address to continue setting up your Palmadex 360 account.",
      "This link expires in 24 hours.",
    ],
    action: { label: "Verify email", url: appUrl(`/verify-email?token=${raw}`) },
  });
}

async function recordLoginFailure(user) {
  const failed = user.failedLoginCount + 1;
  const lock = failed >= MAX_FAILED_LOGINS;
  await prisma.user.update({
    where: { id: user.id },
    data: lock
      ? { failedLoginCount: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000) }
      : { failedLoginCount: failed },
  });
  if (lock) {
    sendMail({
      to: user.email,
      subject: "Your Palmadex 360 account was temporarily locked",
      heading: "Too many sign-in attempts",
      paragraphs: [
        `There were ${MAX_FAILED_LOGINS} failed attempts to sign in to your account, so it is locked for ${LOCK_MINUTES} minutes.`,
        "If this was not you, reset your password once the lock ends.",
      ],
    });
  }
}

const accountError = (status, code, message) => {
  const err = new HttpError(status, message);
  err.publicCode = code;
  return err;
};

export const register = async (input, { ip } = {}) => {
  const organization = input.organization || input.companyName || null;
  const existing = await findUserByEmail(input.email);
  if (existing) throw new HttpError(409, "An account with this email already exists");

  const company = await resolveSignupCompany(organization);
  const userCount = await prisma.user.count({ where: { companyId: company.id } });
  const bootstrap = userCount === 0; // first account ever becomes the Super Admin

  if (!bootstrap && process.env.FACE_ENROLLMENT_REQUIRED !== "false") {
    if (!input.faceImage) throw new HttpError(400, "Take a face photo with your camera to complete sign-up");
    if (input.faceConsent !== true) throw new HttpError(400, "You must agree to the face photo notice");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      companyId: company.id,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone || null,
      organization,
      passwordHash,
      role: bootstrap ? "SUPER_ADMIN" : input.accountType === "CUSTOMER" ? "CUSTOMER" : "VIEWER",
      requestedRole: bootstrap ? null : input.accountType === "CUSTOMER" ? "CUSTOMER" : null,
      approvalStatus: bootstrap ? "APPROVED" : "PENDING",
      emailVerifiedAt: bootstrap ? new Date() : null,
    },
  });

  if (input.faceImage) await faceService.save(user.id, input.faceImage);

  activityService.record({
    companyId: company.id, userId: user.id, action: "registered", entity: "User", entityId: user.id,
    summary: input.accountType === "CUSTOMER" ? "registered as a customer" : "registered as staff", ip,
  });

  if (bootstrap) {
    return { ...(await sessionFor(user.id)), message: "Your Super Admin account is ready." };
  }

  await sendVerificationEmail(user);

  const admins = await notificationService.usersWithAccess(company.id, "access", "EDIT");
  const kind = input.accountType === "CUSTOMER" ? "customer" : "staff member";
  await notificationService.notifyMany(admins.map((a) => a.id), {
    companyId: company.id,
    title: "New registration awaiting approval",
    message: `${fullName(user)} (${user.email}) registered as a ${kind}${organization ? ` from ${organization}` : ""}.`,
    type: "user.registered",
    link: `/access?user=${user.id}`,
  });
  for (const admin of admins) {
    sendMail({
      to: admin.email,
      subject: "New Palmadex 360 registration awaiting approval",
      heading: "A new account needs your approval",
      paragraphs: [
        `${fullName(user)} (${user.email}) registered as a ${kind}${organization ? ` from ${organization}` : ""}.`,
        "Review their details and face photo, then approve the account and assign a role.",
      ],
      action: { label: "Review registration", url: appUrl(`/access?user=${user.id}`) },
    });
  }

  return {
    message: "Account created. Check your email to verify your address. An administrator will then review and approve your account.",
    requiresVerification: true,
    requiresApproval: true,
  };
};

export const login = async ({ email, password }, { ip } = {}) => {
  const user = await findUserByEmail(email);
  const valid = await comparePassword(password, user?.passwordHash || DUMMY_HASH);

  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.ceil((user.lockedUntil - Date.now()) / 60_000);
    throw new HttpError(429, `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
  }

  if (!user || !valid) {
    if (user) await recordLoginFailure(user);
    throw new HttpError(401, "Invalid email or password");
  }

  if (user.failedLoginCount || user.lockedUntil) {
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null } });
  }

  // Account state is only revealed after a correct password.
  if (!user.emailVerifiedAt) {
    throw accountError(403, "EMAIL_NOT_VERIFIED", "Please verify your email address first. Check your inbox or request a new link.");
  }
  if (user.approvalStatus === "PENDING") {
    throw accountError(403, "PENDING_APPROVAL", "Your account is waiting for administrator approval. You will receive an email once it is approved.");
  }
  if (user.approvalStatus === "REJECTED") {
    throw accountError(403, "ACCOUNT_REJECTED", "Your registration was not approved. Contact Palmadex for more information.");
  }
  if (!user.isActive) {
    throw accountError(403, "ACCOUNT_INACTIVE", "This account has been deactivated. Contact your administrator.");
  }

  if (user.twoFactorEnabled) {
    return { twoFactorRequired: true, challengeToken: generateChallengeToken(user) };
  }

  return completeLogin(user, ip);
};

async function completeLogin(user, ip) {
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  activityService.record({ companyId: user.companyId, userId: user.id, action: "signed in", entity: "User", entityId: user.id, summary: "signed in", ip });
  return sessionFor(user.id);
}

export const loginWithTwoFactor = async ({ challengeToken, code }, { ip } = {}) => {
  let payload;
  try {
    payload = verifyChallengeToken(challengeToken);
  } catch {
    throw new HttpError(401, "Your sign-in attempt expired. Please sign in again.");
  }
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret || (payload.v ?? 0) !== user.tokenVersion) {
    throw new HttpError(401, "Your sign-in attempt expired. Please sign in again.");
  }
  if (!verifyCode(decrypt(user.twoFactorSecret), code)) {
    await recordLoginFailure(user);
    throw new HttpError(401, "That code is not correct. Check your authenticator app and try again.");
  }
  return completeLogin(user, ip);
};

export const verifyEmail = async ({ token }) => {
  const row = await tokenService.check(token, ["EMAIL_VERIFICATION"]);
  const user = await prisma.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } });
  await tokenService.consume(row.id);
  return {
    message: user.approvalStatus === "APPROVED"
      ? "Your email is verified. You can now sign in."
      : "Your email is verified. An administrator will review your account and email you once it is approved.",
    approvalPending: user.approvalStatus === "PENDING",
  };
};

const GENERIC_EMAIL_REPLY = "If an account exists for that email, we have sent a message to it.";

export const resendVerification = async ({ email }) => {
  const user = await findUserByEmail(email);
  if (user && !user.emailVerifiedAt) await sendVerificationEmail(user);
  return { message: GENERIC_EMAIL_REPLY };
};

export const forgotPassword = async ({ email }) => {
  const user = await findUserByEmail(email);
  if (user && user.isActive && user.approvalStatus !== "REJECTED") {
    const raw = await tokenService.issue(user.id, "PASSWORD_RESET");
    await sendMail({
      to: user.email,
      subject: "Reset your Palmadex 360 password",
      heading: "Password reset requested",
      paragraphs: [
        `Hello ${user.firstName}, we received a request to reset your password.`,
        "This link expires in 1 hour. If you did not ask for this, you can ignore this email.",
      ],
      action: { label: "Choose a new password", url: appUrl(`/reset-password?token=${raw}`) },
    });
  }
  return { message: GENERIC_EMAIL_REPLY };
};

// Handles both password resets and invitations (an invited user sets their first password).
export const resetPassword = async ({ token, password }) => {
  const row = await tokenService.check(token, ["PASSWORD_RESET", "INVITE"]);
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.update({
    where: { id: row.userId },
    data: {
      passwordHash,
      tokenVersion: { increment: 1 },
      failedLoginCount: 0,
      lockedUntil: null,
      ...(row.type === "INVITE" ? { emailVerifiedAt: new Date() } : {}),
    },
  });
  await tokenService.consume(row.id);
  await prisma.userToken.updateMany({ where: { userId: user.id, type: "PASSWORD_RESET", usedAt: null }, data: { usedAt: new Date() } });

  sendMail({
    to: user.email,
    subject: "Your Palmadex 360 password was changed",
    heading: "Password changed",
    paragraphs: ["Your password was just changed and you were signed out of other devices.", "If this was not you, contact your administrator immediately."],
  });

  return { message: row.type === "INVITE" ? "Your password is set. You can now sign in." : "Your password has been reset. You can now sign in." };
};

export const changePassword = async (authUser, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!(await comparePassword(currentPassword, user.passwordHash))) throw new HttpError(400, "Your current password is not correct");
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword), tokenVersion: { increment: 1 } },
  });
  return { ...(await sessionFor(user.id)), message: "Password changed. Other devices have been signed out." };
};

export const me = async (authUser) => ({ user: toSafeUser(authUser) });

export const updateProfile = async (authUser, input) => {
  await prisma.user.update({ where: { id: authUser.id }, data: input });
  return { user: (await sessionFor(authUser.id)).user };
};

export const logoutEverywhere = async (authUser) => {
  await prisma.user.update({ where: { id: authUser.id }, data: { tokenVersion: { increment: 1 } } });
  return { message: "You have been signed out on all devices." };
};

// Two-factor setup: returns a secret to scan. It is stored encrypted but only switched on after enableTwoFactor.
export const setupTwoFactor = async (authUser) => {
  if (authUser.twoFactorEnabled) throw new HttpError(400, "Two-factor sign-in is already on");
  const secret = generateSecret();
  await prisma.user.update({ where: { id: authUser.id }, data: { twoFactorSecret: encrypt(secret) } });
  const url = otpauthUrl({ secret, email: authUser.email });
  let qrCode = null;
  try {
    const QRCode = (await import("qrcode")).default;
    qrCode = await QRCode.toDataURL(url, { margin: 1, width: 220 });
  } catch {
    qrCode = null;
  }
  return { secret, otpauthUrl: url, qrCode };
};

export const enableTwoFactor = async (authUser, { code }) => {
  const user = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!user.twoFactorSecret) throw new HttpError(400, "Start two-factor setup first");
  if (!verifyCode(decrypt(user.twoFactorSecret), code)) throw new HttpError(400, "That code is not correct. Try the newest code in your app.");
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
  sendMail({
    to: user.email,
    subject: "Two-factor sign-in is on",
    heading: "Two-factor sign-in enabled",
    paragraphs: ["From now on you will be asked for a code from your authenticator app when you sign in."],
  });
  return { message: "Two-factor sign-in is now on." };
};

export const disableTwoFactor = async (authUser, { password, code }) => {
  const user = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!user.twoFactorEnabled) throw new HttpError(400, "Two-factor sign-in is not on");
  if (!(await comparePassword(password, user.passwordHash))) throw new HttpError(400, "Your password is not correct");
  if (!verifyCode(decrypt(user.twoFactorSecret), code)) throw new HttpError(400, "That code is not correct");
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
  return { message: "Two-factor sign-in is now off." };
};

export const enrollFace = async (authUser, { image }) => {
  await faceService.save(authUser.id, image);
  const admins = await notificationService.usersWithAccess(authUser.companyId, "access", "EDIT");
  await notificationService.notifyMany(admins.filter((a) => a.id !== authUser.id).map((a) => a.id), {
    companyId: authUser.companyId,
    title: "Face photo submitted for review",
    message: `${fullName(authUser)} submitted a face photo for identity verification.`,
    type: "user.face",
    link: `/access?user=${authUser.id}`,
  });
  return { user: (await sessionFor(authUser.id)).user, message: "Thank you. Your face photo has been submitted for verification." };
};

export const faceFileFor = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { faceImagePath: true } });
  return faceService.load(userId, user?.faceImagePath);
};
