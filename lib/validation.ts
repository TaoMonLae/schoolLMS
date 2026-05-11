/**
 * lib/validation.ts — Zod schemas for all form inputs
 * ──────────────────────────────────────────────────────
 * Single source of truth for input validation.
 * Used in server actions, API routes, and (optionally) client-side forms.
 *
 * Usage:
 *   import { CreateSchoolSchema } from "@/lib/validation";
 *   const result = CreateSchoolSchema.safeParse(Object.fromEntries(formData));
 *   if (!result.success) {
 *     return { error: result.error.flatten().fieldErrors };
 *   }
 */

import { z } from "zod";

// ── Primitives ────────────────────────────────────────────────────────────────

export const HexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex colour (e.g. #17211b)");

export const SubdomainSchema = z
  .string()
  .toLowerCase()
  .regex(
    /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/,
    "Subdomain must be 3–63 lowercase alphanumeric characters or hyphens, and cannot start/end with a hyphen"
  )
  .optional();

export const SchoolCodeSchema = z
  .string()
  .min(2, "Code must be at least 2 characters")
  .max(20, "Code must be at most 20 characters")
  .regex(/^[A-Z0-9-]+$/, "Code must contain only uppercase letters, digits, or hyphens");

export const EmailSchema = z
  .string()
  .email("Must be a valid email address")
  .max(254, "Email is too long")
  .toLowerCase();

export const PasswordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// ── School schemas ────────────────────────────────────────────────────────────

export const CreateSchoolSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long").trim(),
  shortName: z.string().max(40, "Short name is too long").trim().optional(),
  code: SchoolCodeSchema,
  address: z.string().max(200).trim().optional(),
  city: z.string().max(100).trim().optional(),
  country: z.string().max(100).trim().optional(),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-().]{7,25}$/, "Must be a valid phone number")
    .optional()
    .or(z.literal("")),
  email: EmailSchema.optional().or(z.literal("")),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  subdomain: SubdomainSchema,
  customDomain: z
    .string()
    .regex(
      /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/,
      "Must be a valid domain name (e.g. learn.school.org)"
    )
    .optional()
    .or(z.literal("")),
  primaryColor: HexColorSchema.default("#17211b"),
  secondaryColor: HexColorSchema.default("#b46a45"),
  timezone: z.string().max(50).default("UTC"),
});

export type CreateSchoolInput = z.infer<typeof CreateSchoolSchema>;

export const UpdateSchoolSchema = CreateSchoolSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateSchoolInput = z.infer<typeof UpdateSchoolSchema>;

// ── School admin creation ─────────────────────────────────────────────────────

export const CreateSchoolAdminSchema = z.object({
  schoolId: z.string().min(1, "School ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100).trim(),
  email: EmailSchema,
  password: PasswordSchema,
});

export type CreateSchoolAdminInput = z.infer<typeof CreateSchoolAdminSchema>;

// ── Student / enrolment ───────────────────────────────────────────────────────

export const StudentSchema = z.object({
  name: z.string().min(2, "Name is required").max(100).trim(),
  email: EmailSchema.optional().or(z.literal("")),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  nationality: z.string().max(100).trim().optional(),
  // UNHCR / document numbers are stored encrypted — only accept non-empty strings
  documentNumber: z
    .string()
    .max(50)
    .regex(/^[A-Z0-9\-\/]+$/i, "Document number contains invalid characters")
    .optional()
    .or(z.literal("")),
  guardianName: z.string().max(100).trim().optional(),
  guardianPhone: z
    .string()
    .regex(/^\+?[\d\s\-().]{7,25}$/, "Must be a valid phone number")
    .optional()
    .or(z.literal("")),
  schoolId: z.string().min(1, "School ID is required"),
  classId: z.string().optional(),
});

export type StudentInput = z.infer<typeof StudentSchema>;

// ── Login ─────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z
    .string()
    .min(1, "Password is required")
    .max(256, "Password is too long"),
  subdomain: z
    .string()
    .max(63)
    .optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ── File upload ───────────────────────────────────────────────────────────────

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
] as const;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const FileUploadSchema = z.object({
  fileName: z
    .string()
    .min(1, "File name is required")
    .max(255, "File name is too long")
    // Strip path traversal sequences
    .refine(
      (name) => !name.includes("..") && !name.includes("/") && !name.includes("\\"),
      "File name must not contain path separators"
    ),
  mimeType: z.string().min(1, "MIME type is required"),
  sizeBytes: z
    .number()
    .positive("File must not be empty")
    .max(50 * 1024 * 1024, "File must not exceed 50 MB"),
  category: z.enum(["document", "video", "image", "logo"]).default("document"),
});

export type FileUploadInput = z.infer<typeof FileUploadSchema>;

export const DocumentUploadSchema = FileUploadSchema.extend({
  category: z.literal("document"),
  mimeType: z.enum(ALLOWED_DOCUMENT_TYPES).refine(
    (v) => ALLOWED_DOCUMENT_TYPES.includes(v as typeof ALLOWED_DOCUMENT_TYPES[number]),
    { message: `Document must be one of: ${ALLOWED_DOCUMENT_TYPES.join(", ")}` }
  ),
  sizeBytes: z.number().positive().max(10 * 1024 * 1024, "Documents must not exceed 10 MB"),
});

export const VideoUploadSchema = FileUploadSchema.extend({
  category: z.literal("video"),
  mimeType: z.enum(ALLOWED_VIDEO_TYPES).refine(
    (v) => ALLOWED_VIDEO_TYPES.includes(v as typeof ALLOWED_VIDEO_TYPES[number]),
    { message: `Video must be one of: ${ALLOWED_VIDEO_TYPES.join(", ")}` }
  ),
  sizeBytes: z.number().positive().max(500 * 1024 * 1024, "Videos must not exceed 500 MB"),
});

export const ImageUploadSchema = FileUploadSchema.extend({
  category: z.enum(["image", "logo"] as const),
  mimeType: z.enum(ALLOWED_IMAGE_TYPES).refine(
    (v) => ALLOWED_IMAGE_TYPES.includes(v as typeof ALLOWED_IMAGE_TYPES[number]),
    { message: `Image must be one of: ${ALLOWED_IMAGE_TYPES.join(", ")}` }
  ),
  sizeBytes: z.number().positive().max(5 * 1024 * 1024, "Images must not exceed 5 MB"),
});

// ── School logo URL (current URL-based approach) ──────────────────────────────

export const LogoUrlSchema = z.object({
  logoUrl: z
    .string()
    .url("Must be a valid HTTPS URL")
    .refine((url) => url.startsWith("https://"), "Logo URL must use HTTPS")
    .or(z.literal("")),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Converts Zod flatten field errors to a flat Record<string, string>
 * suitable for displaying next to form fields.
 */
export function flattenZodErrors(
  errors: z.ZodError
): Record<string, string> {
  const flat = errors.flatten();
  const fieldErrors = flat.fieldErrors as Record<string, string[] | undefined>;
  const result: Record<string, string> = {};
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (Array.isArray(messages) && messages.length > 0) {
      result[field] = messages[0];
    }
  }
  return result;
}

/**
 * Safely parses FormData into a plain object, trimming string values.
 * Suitable for passing to Zod .safeParse().
 */
export function formDataToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      obj[key] = value.trim();
    }
  }
  return obj;
}
