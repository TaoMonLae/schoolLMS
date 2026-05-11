import { db } from "@/lib/db";
import { resolveSchoolId } from "@/lib/tenant";
import { AppUser, SchoolSummary } from "@/lib/types";

const defaultBranding: SchoolSummary = {
  id: "unconfigured",
  name: "School LMS",
  shortName: "School LMS",
  code: "SCHOOL",
  logoUrl: "",
  primaryColor: "#17211b",
  secondaryColor: "#b46a45",
  city: "",
  country: "",
  activeStudents: 0,
  activeClasses: 0
};

export async function getSchoolBrandingForUser(user: AppUser, requestedSchoolId?: string): Promise<SchoolSummary> {
  const schoolId = resolveSchoolId(user, requestedSchoolId);
  const school = await db.school.findFirst({
    where: { id: schoolId, isActive: true },
    include: {
      _count: {
        select: {
          students: { where: { status: "ACTIVE", deletedAt: null } },
          classes: true
        }
      }
    }
  });

  if (!school) return defaultBranding;

  return {
    id: school.id,
    name: school.name,
    shortName: school.shortName || undefined,
    code: school.code,
    logoUrl: school.logoUrl || undefined,
    primaryColor: school.primaryColor,
    secondaryColor: school.secondaryColor,
    address: school.address || undefined,
    phone: school.phone || undefined,
    email: school.email || undefined,
    website: school.website || undefined,
    customDomain: school.customDomain || undefined,
    subdomain: school.subdomain || undefined,
    city: school.city || "",
    country: school.country || "",
    activeStudents: school._count.students,
    activeClasses: school._count.classes
  };
}

export async function getFirstActiveSchoolBranding(): Promise<SchoolSummary> {
  const school = await db.school.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
  if (!school) return defaultBranding;
  return {
    ...defaultBranding,
    id: school.id,
    name: school.name,
    shortName: school.shortName || undefined,
    code: school.code,
    logoUrl: school.logoUrl || undefined,
    primaryColor: school.primaryColor,
    secondaryColor: school.secondaryColor,
    address: school.address || undefined,
    phone: school.phone || undefined,
    email: school.email || undefined,
    website: school.website || undefined,
    customDomain: school.customDomain || undefined,
    subdomain: school.subdomain || undefined,
    city: school.city || "",
    country: school.country || ""
  };
}

export function canEditSchoolBranding(user: AppUser, schoolId: string): boolean {
  return user.role === "SUPER_ADMIN" || (user.role === "SCHOOL_ADMIN" && user.schoolId === schoolId);
}

export function getDisplaySchoolName(school: Pick<SchoolSummary, "name" | "shortName">): string {
  return school.shortName || school.name;
}

export function getSchoolOrigin(school: Pick<SchoolSummary, "code" | "subdomain" | "customDomain">): string {
  if (school.customDomain) return `https://${school.customDomain}`;
  return `https://${school.subdomain || school.code.toLowerCase()}.refugeeschoolos.com`;
}

// Compatibility export for legacy super-admin fallback UI only; runtime tenant pages use DB branding helpers above.
export const demoSchoolBranding: SchoolSummary = defaultBranding;
