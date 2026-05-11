import { AppUser } from "@/lib/types";

// ─── Error ────────────────────────────────────────────────────────────────────

export class TenantAccessError extends Error {
  readonly statusCode = 403;
  constructor(message = "Access denied: cross-school data access is not permitted") {
    super(message);
    this.name = "TenantAccessError";
  }
}

// ─── Core guards ──────────────────────────────────────────────────────────────

/**
 * TENANT GUARD — primary enforcement point for multi-tenant data isolation.
 *
 * Call this at the top of every server action, route handler, or data function
 * that accesses school-scoped data. SUPER_ADMIN passes all checks automatically.
 *
 * @example
 *   assertTenantAccess(user, student.schoolId);
 *   // → throws TenantAccessError if user.schoolId !== student.schoolId
 */
export function assertTenantAccess(user: AppUser, resourceSchoolId: string): void {
  if (user.role === "SUPER_ADMIN") return;

  if (!user.schoolId) {
    console.warn(`[TENANT_GUARD] User ${user.id} (${user.role}) has no assigned school`);
    throw new TenantAccessError("User has no assigned school");
  }

  if (user.schoolId !== resourceSchoolId) {
    console.warn(
      `[TENANT_GUARD] Cross-school access attempt: user=${user.id} role=${user.role} ` +
        `userSchool=${user.schoolId} requestedSchool=${resourceSchoolId}`
    );
    throw new TenantAccessError();
  }
}

/**
 * Validates that a fetched resource belongs to the user's school.
 * Use after a findUnique/findFirst to prevent ID-guessing cross-school access.
 *
 * @example
 *   const student = await db.student.findUnique({ where: { id } });
 *   assertResourceBelongsToTenant(user, student, "Student");
 */
export function assertResourceBelongsToTenant(
  user: AppUser,
  resource: { schoolId: string } | null | undefined,
  label = "resource"
): asserts resource is { schoolId: string } {
  if (!resource) throw new TenantAccessError(`${label} not found`);
  assertTenantAccess(user, resource.schoolId);
}

// ─── Query helpers ────────────────────────────────────────────────────────────

/**
 * Returns a Prisma-compatible `where`-clause fragment that scopes queries to
 * the correct school. Non-SUPER_ADMIN users are always forced to their own
 * schoolId regardless of any `explicitSchoolId` argument — this prevents
 * override attacks.
 *
 * @example
 *   const students = await db.student.findMany({
 *     where: { ...tenantFilter(user), status: "ACTIVE" }
 *   });
 */
export function tenantFilter(user: AppUser, explicitSchoolId?: string): { schoolId: string } {
  if (user.role === "SUPER_ADMIN") {
    const schoolId = explicitSchoolId ?? user.schoolId;
    if (!schoolId) throw new TenantAccessError("SUPER_ADMIN must supply a schoolId for tenantFilter");
    return { schoolId };
  }
  if (!user.schoolId) throw new TenantAccessError("User has no assigned school");
  // Non-SUPER_ADMIN: always use their own schoolId, ignore any explicit override
  return { schoolId: user.schoolId };
}

/**
 * Resolves the active schoolId for a scoped operation.
 * - SUPER_ADMIN + explicit schoolId → uses the explicit schoolId
 * - SUPER_ADMIN + user.schoolId fallback → uses that
 * - All other roles → forces their own schoolId (ignores explicit)
 * - No schoolId → throws TenantAccessError
 */
export function resolveSchoolId(user: AppUser, requestedSchoolId?: string): string {
  if (user.role === "SUPER_ADMIN") {
    const schoolId = requestedSchoolId ?? user.schoolId;
    if (!schoolId) throw new TenantAccessError("SUPER_ADMIN must supply a schoolId for scoped operations");
    return schoolId;
  }
  if (user.schoolId) return user.schoolId;
  throw new TenantAccessError("Cannot resolve school — user has no assigned school");
}

// ─── Safety-net filter ────────────────────────────────────────────────────────

/**
 * Post-fetch safety net. Filters a list of tenant-scoped records to only those
 * belonging to the user's school. This is a second layer of defence — it
 * prevents data leaks even if a query accidentally omits the schoolId filter.
 *
 * @example
 *   const books = filterToTenant(user, rawQueryResults);
 */
export function filterToTenant<T extends { schoolId: string }>(user: AppUser, records: T[]): T[] {
  if (user.role === "SUPER_ADMIN") return records;
  if (!user.schoolId) return [];
  return records.filter((r) => r.schoolId === user.schoolId);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Returns true if the user has platform-wide SUPER_ADMIN access. */
export function isSuperAdmin(user: AppUser): boolean {
  return user.role === "SUPER_ADMIN";
}

/**
 * Asserts the user is SUPER_ADMIN and throws TenantAccessError otherwise.
 * Use at the top of super-admin-only server actions.
 */
export function requireSuperAdmin(user: AppUser): void {
  if (!isSuperAdmin(user)) {
    throw new TenantAccessError("This action requires SUPER_ADMIN privileges");
  }
}
