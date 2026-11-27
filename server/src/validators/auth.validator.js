import { z } from "zod";

const email = z.string().trim().toLowerCase().email("A valid email address is required").max(191);
export const passwordRule = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), "Password must contain at least one letter and one number");

const optText = (max) => z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().trim().max(max).optional());

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email,
  password: passwordRule,
  phone: optText(40),
  organization: optText(191),
  // Older clients send companyName.
  companyName: optText(191),
  accountType: z.enum(["CUSTOMER", "STAFF"]).default("CUSTOMER"),
  // Face photo captured with the camera during sign-up, for identity verification by an admin.
  faceImage: z.string().regex(/^data:image\/(jpeg|png|webp);base64,/, "Take a face photo with your camera").max(3_000_000, "Photo is too large").optional(),
  faceConsent: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email and password are required"),
  password: z.string().min(1, "Email and password are required"),
});

export const emailOnlySchema = z.object({ email });
export const tokenSchema = z.object({ token: z.string().min(10, "The link is invalid") });
export const resetPasswordSchema = z.object({ token: z.string().min(10, "The link is invalid"), password: passwordRule });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: passwordRule });
export const twoFactorCodeSchema = z.object({ code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") });
export const twoFactorLoginSchema = z.object({
  challengeToken: z.string().min(10),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});
export const disableTwoFactorSchema = z.object({ password: z.string().min(1), code: z.string().trim().regex(/^\d{6}$/) });
export const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  phone: z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(40).nullable().optional()),
  organization: z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(191).nullable().optional()),
});
export const faceImageSchema = z.object({
  image: z.string().regex(/^data:image\/(jpeg|png|webp);base64,/, "Capture a photo with your camera").max(3_000_000, "Photo is too large"),
  consent: z.literal(true, { message: "You must agree to the face registration notice" }),
});
