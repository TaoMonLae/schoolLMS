import { AppUser, SchoolSummary } from "@/lib/types";

// ─── Demo / seed school ───────────────────────────────────────────────────────

/**
 * Static fallback used when no DB connection is available.
 * All demo pages reference this so the UI renders without a live database.
 */
export const demoSchoolBranding: SchoolSummary = {
  id: "seed-school-mon-rlc",
  name: "Mon Refugee Learning Centre",
  shortName: "Mon RLC",
  code: "MON-RLC",
  logoUrl: "",
  primaryColor: "#17211b",
  secondaryColor: "#b46a45",
  address: "Sentul, Kuala Lumpur, Malaysia",
  phone: "+60 12 000 0000",
  email: "admin@monrlc.example",
  website: "https://monrlc.example",
  customDomain: "learn.monrlc.example",
  subdomain: "monrlc",
  city: "Kuala Lumpur",
  country: "Malaysia",
  activeStudents: 5,
  activeClasses: 3,
};

// ─── Branding helpers ─────────────────────────────────────────────────────────

export function getSchoolBrandingForUser(user: AppUser): SchoolSummary | undefined {
  if (user.role === "SUPER_ADMIN" || user.schoolId === demoSchoolBranding.id) {
    return demoSchoolBranding;
  }
  return undefined;
}

export function canEditSchoolBranding(user: AppUser, schoolId: string): boolean {
  return user.role === "SUPER_ADMIN" || (user.role === "SCHOOL_ADMIN" && user.schoolId === schoolId);
}

export function getDisplaySchoolName(
  school: Pick<SchoolSummary, "name" | "shortName"> = demoSchoolBranding
): string {
  return school.shortName || school.name;
}

export function getSchoolOrigin(school: Pick<SchoolSummary, "code" | "subdomain" | "customDomain"> = demoSchoolBranding): string {
  if (school.customDomain) {
    return `https://${school.customDomain}`;
  }
  return `https://${school.subdomain || school.code.toLowerCase()}.refugeeschoolos.com`;
}

// ─── Dynamic branding from request headers ────────────────────────────────────

export type MinimalBranding = {
  id: string;
  name: string;
  shortName?: string | null;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string | null;
  code: string;
};

/**
 * Reads school branding from the Next.js request headers set by middleware.
 * Falls back to the demo school when headers are absent (local dev / demo mode).
 *
 * Call from a Server Component that has access to `next/headers`.
 */
export function getBrandingFromHeaders(headerMap: Map<string, string>): MinimalBranding {
  const schoolId = headerMap.get("x-session-school-id");

  // In demo/dev mode with no DB, just return the demo school branding
  if (!schoolId || schoolId === demoSchoolBranding.id) {
    return demoSchoolBranding;
  }

  // Branding is resolved fully in the dashboard layout via lib/schools.ts
  // This function provides the static fallback shape only
  return demoSchoolBranding;
}
