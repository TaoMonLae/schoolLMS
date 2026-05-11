import { z } from "zod";
import type { AppUser } from "@/lib/types";

const hexColorSchema = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex color such as #17211b.").transform((value) => value.toLowerCase());
const optionalTrimmed = z.preprocess((value) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length ? text : undefined;
}, z.string().max(255).optional());
const optionalLongText = z.preprocess((value) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length ? text : undefined;
}, z.string().max(1000).optional());
const optionalEmail = z.preprocess((value) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length ? text : undefined;
}, z.string().email("Enter a valid school email address.").max(255).optional());
const optionalUrl = z.preprocess((value) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length ? text : undefined;
}, z.string().url("Enter a valid URL including https://.").max(255).optional());
const subdomainSchema = z.preprocess((value) => {
  const text = typeof value === "string" ? value.trim().toLowerCase() : "";
  return text.length ? text : undefined;
}, z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/, "Use lowercase letters, numbers, and hyphens; do not start or end with a hyphen.").optional());
const customDomainSchema = z.preprocess((value) => {
  const text = typeof value === "string" ? value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "") : "";
  return text.length ? text : undefined;
}, z.string().regex(/^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/, "Enter a safe domain such as school.example.org, without a path.").optional());

export const SchoolBrandingSchema = z.object({
  schoolId: z.string().min(1),
  name: z.string().trim().min(1, "School name is required.").max(255),
  shortName: optionalTrimmed,
  subdomain: subdomainSchema,
  customDomain: customDomainSchema,
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  phone: optionalTrimmed,
  email: optionalEmail,
  website: optionalUrl,
  address: optionalLongText,
  city: optionalTrimmed,
  country: optionalTrimmed,
  timezone: optionalTrimmed,
  removeLogo: z.preprocess((value) => value === "on" || value === "true" || value === true, z.boolean())
});

export type SchoolBrandingInput = z.infer<typeof SchoolBrandingSchema>;

export function validateSchoolBrandingForm(formData: FormData) {
  return SchoolBrandingSchema.safeParse({
    schoolId: formData.get("schoolId"),
    name: formData.get("name"),
    shortName: formData.get("shortName"),
    subdomain: formData.get("subdomain"),
    customDomain: formData.get("customDomain"),
    primaryColor: formData.get("primaryColorText") || formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColorText") || formData.get("secondaryColor"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    website: formData.get("website"),
    address: formData.get("address"),
    city: formData.get("city"),
    country: formData.get("country"),
    timezone: formData.get("timezone"),
    removeLogo: formData.get("removeLogo")
  });
}

export function canUpdateRequestedSchoolBranding(user: AppUser, requestedSchoolId: string): boolean {
  if (!requestedSchoolId) return false;
  if (user.role === "SUPER_ADMIN") return true;
  if (user.role !== "SCHOOL_ADMIN") return false;
  return user.schoolId === requestedSchoolId;
}

export function brandingDataForPrisma(input: SchoolBrandingInput) {
  return {
    name: input.name,
    shortName: input.shortName ?? null,
    subdomain: input.subdomain ?? null,
    customDomain: input.customDomain ?? null,
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    phone: input.phone ?? null,
    email: input.email ?? null,
    website: input.website ?? null,
    address: input.address ?? null,
    city: input.city ?? null,
    country: input.country ?? null,
    ...(input.timezone ? { timezone: input.timezone } : {})
  };
}

export function flattenBrandingErrors(error: z.ZodError<SchoolBrandingInput>) {
  const flattened = error.flatten().fieldErrors;
  const first = Object.values(flattened).flat()[0] ?? "Branding values are invalid.";
  return { fieldErrors: flattened, firstError: first };
}
