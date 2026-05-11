import { db } from "@/lib/db";
import { assertTenantAccess, filterToTenant, requireSuperAdmin, TenantAccessError } from "@/lib/tenant";
import { AppUser, SchoolSummary } from "@/lib/types";

// ─── Input types ──────────────────────────────────────────────────────────────

export type CreateSchoolInput = {
  name: string;
  shortName?: string;
  code: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  subdomain?: string;
  customDomain?: string;
  primaryColor?: string;
  secondaryColor?: string;
  timezone?: string;
};

export type UpdateSchoolInput = {
  name?: string;
  shortName?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  subdomain?: string;
  customDomain?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  timezone?: string;
};

export type CreateSchoolAdminInput = {
  name: string;
  email: string;
  /** Pre-hashed password. Hash before calling this function. */
  passwordHash: string;
};

// ─── Mapping helper ───────────────────────────────────────────────────────────

function toSchoolSummary(
  school: {
    id: string;
    name: string;
    shortName: string | null;
    code: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    customDomain: string | null;
    subdomain: string | null;
    city: string | null;
    country: string | null;
    _count: { students: number; classes: number };
  }
): SchoolSummary {
  return {
    id: school.id,
    name: school.name,
    shortName: school.shortName ?? undefined,
    code: school.code,
    logoUrl: school.logoUrl ?? undefined,
    primaryColor: school.primaryColor,
    secondaryColor: school.secondaryColor,
    address: school.address ?? undefined,
    phone: school.phone ?? undefined,
    email: school.email ?? undefined,
    website: school.website ?? undefined,
    customDomain: school.customDomain ?? undefined,
    subdomain: school.subdomain ?? undefined,
    city: school.city ?? "",
    country: school.country ?? "",
    activeStudents: school._count.students,
    activeClasses: school._count.classes,
  };
}

const schoolWithCounts = {
  _count: {
    select: {
      students: { where: { status: "ACTIVE" as const, deletedAt: null } },
      classes: true,
    },
  },
} as const;

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all school tenants. SUPER_ADMIN only.
 * school_id filtering: N/A — this is the platform-level list.
 */
export async function getAllSchools(user: AppUser): Promise<SchoolSummary[]> {
  requireSuperAdmin(user);

  const schools = await db.school.findMany({
    include: schoolWithCounts,
    orderBy: { createdAt: "desc" },
  });

  return schools.map(toSchoolSummary);
}

/**
 * Fetch a single school. SUPER_ADMIN can fetch any; other roles can only fetch
 * their own (tenant access enforced by assertTenantAccess).
 */
export async function getSchoolById(user: AppUser, schoolId: string): Promise<SchoolSummary | null> {
  assertTenantAccess(user, schoolId);

  const school = await db.school.findUnique({
    where: { id: schoolId },
    include: schoolWithCounts,
  });

  if (!school) return null;
  return toSchoolSummary(school);
}

/**
 * Resolve school branding from a subdomain slug.
 * Used by the dashboard layout to apply per-school colors and logo.
 * No user context required — branding is public per subdomain.
 */
export async function getSchoolBySubdomain(subdomain: string) {
  return db.school.findUnique({
    where: { subdomain },
    select: {
      id: true,
      name: true,
      shortName: true,
      primaryColor: true,
      secondaryColor: true,
      logoUrl: true,
      code: true,
    },
  });
}

/** Resolve school branding from a custom domain. */
export async function getSchoolByCustomDomain(domain: string) {
  return db.school.findUnique({
    where: { customDomain: domain },
    select: {
      id: true,
      name: true,
      shortName: true,
      primaryColor: true,
      secondaryColor: true,
      logoUrl: true,
      code: true,
    },
  });
}

/**
 * List all admin users for a school.
 * SUPER_ADMIN or the school's own SCHOOL_ADMIN may call this.
 */
export async function getSchoolAdmins(user: AppUser, schoolId: string) {
  assertTenantAccess(user, schoolId);

  return db.user.findMany({
    where: { schoolId, role: "SCHOOL_ADMIN" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Create a new school tenant. SUPER_ADMIN only.
 * All records created under this school will carry its generated id as school_id.
 */
export async function createSchool(user: AppUser, input: CreateSchoolInput) {
  requireSuperAdmin(user);

  // Normalize slug fields
  const subdomain = input.subdomain?.trim().toLowerCase() || undefined;
  const customDomain = input.customDomain?.trim().toLowerCase() || undefined;
  const code = input.code.trim().toUpperCase();

  return db.school.create({
    data: {
      name: input.name.trim(),
      shortName: input.shortName?.trim() || undefined,
      code,
      address: input.address?.trim() || undefined,
      city: input.city?.trim() || undefined,
      country: input.country?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      email: input.email?.trim() || undefined,
      website: input.website?.trim() || undefined,
      subdomain,
      customDomain,
      primaryColor: input.primaryColor ?? "#17211b",
      secondaryColor: input.secondaryColor ?? "#b46a45",
      timezone: input.timezone ?? "UTC",
    },
  });
}

/**
 * Update school settings.
 * SUPER_ADMIN can update any school; SCHOOL_ADMIN can only update their own.
 */
export async function updateSchool(user: AppUser, schoolId: string, input: UpdateSchoolInput) {
  assertTenantAccess(user, schoolId);
  if (user.role !== "SUPER_ADMIN" && user.role !== "SCHOOL_ADMIN") {
    throw new TenantAccessError("Only SUPER_ADMIN or SCHOOL_ADMIN can update school settings");
  }

  return db.school.update({
    where: { id: schoolId },
    data: {
      name: input.name?.trim(),
      shortName: input.shortName?.trim() || undefined,
      address: input.address?.trim() || undefined,
      city: input.city?.trim() || undefined,
      country: input.country?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      email: input.email?.trim() || undefined,
      website: input.website?.trim() || undefined,
      subdomain: input.subdomain?.trim().toLowerCase() || undefined,
      customDomain: input.customDomain?.trim().toLowerCase() || undefined,
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
      logoUrl: input.logoUrl,
      timezone: input.timezone,
    },
  });
}

/**
 * Update the school logo URL.
 * Accepts a remote URL (CDN / object storage) or a relative path.
 * SUPER_ADMIN or school's own SCHOOL_ADMIN only.
 */
export async function updateSchoolLogo(user: AppUser, schoolId: string, logoUrl: string) {
  assertTenantAccess(user, schoolId);
  if (user.role !== "SUPER_ADMIN" && user.role !== "SCHOOL_ADMIN") {
    throw new TenantAccessError("Only SUPER_ADMIN or SCHOOL_ADMIN can update the school logo");
  }

  return db.school.update({
    where: { id: schoolId },
    data: { logoUrl: logoUrl.trim() },
  });
}

/**
 * Create a SCHOOL_ADMIN user for a specific school.
 * SUPER_ADMIN only — school admins cannot self-provision other admins.
 */
export async function createSchoolAdmin(
  user: AppUser,
  schoolId: string,
  input: CreateSchoolAdminInput
) {
  requireSuperAdmin(user);

  const school = await db.school.findUnique({ where: { id: schoolId }, select: { id: true } });
  if (!school) throw new Error(`School not found: ${schoolId}`);

  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) throw new Error(`A user with email "${input.email}" already exists`);

  return db.user.create({
    data: {
      schoolId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: "SCHOOL_ADMIN",
      passwordHash: input.passwordHash,
      isActive: true,
    },
  });
}

// ─── Demo fallback ────────────────────────────────────────────────────────────

/**
 * Returns a best-effort school summary for the current request context.
 * Checks (in order): custom domain → subdomain header → session schoolId → demo fallback.
 * Used by the dashboard layout so pages render even without a DB connection.
 */
export async function resolveSchoolBrandingForRequest(
  subdomain: string | null,
  customDomain: string | null,
  sessionSchoolId: string | null
): Promise<{
  id: string;
  name: string;
  shortName?: string | null;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string | null;
  code: string;
} | null> {
  try {
    if (customDomain) {
      const school = await getSchoolByCustomDomain(customDomain);
      if (school) return school;
    }
    if (subdomain) {
      const school = await getSchoolBySubdomain(subdomain);
      if (school) return school;
    }
    if (sessionSchoolId) {
      const school = await db.school.findUnique({
        where: { id: sessionSchoolId },
        select: { id: true, name: true, shortName: true, primaryColor: true, secondaryColor: true, logoUrl: true, code: true },
      });
      if (school) return school;
    }
  } catch {
    // DB not connected — fall through to demo data
  }
  return null;
}
