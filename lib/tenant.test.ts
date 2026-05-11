import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppUser } from "@/lib/types";
import {
  assertResourceBelongsToTenant,
  assertTenantAccess,
  filterToTenant,
  isSuperAdmin,
  requireSuperAdmin,
  resolveSchoolId,
  tenantFilter,
  TenantAccessError,
} from "@/lib/tenant";

// ─── Test fixtures ────────────────────────────────────────────────────────────

const SCHOOL_A = "school-alpha-id";
const SCHOOL_B = "school-bravo-id";

const adminA: AppUser = { id: "admin-a", schoolId: SCHOOL_A, role: "SCHOOL_ADMIN", assignedClassIds: [] };
const adminB: AppUser = { id: "admin-b", schoolId: SCHOOL_B, role: "SCHOOL_ADMIN", assignedClassIds: [] };
const superAdmin: AppUser = { id: "super", schoolId: undefined, role: "SUPER_ADMIN", assignedClassIds: [] };
const superAdminScoped: AppUser = { id: "super-scoped", schoolId: SCHOOL_A, role: "SUPER_ADMIN", assignedClassIds: [] };
const teacherA: AppUser = { id: "teacher-a", schoolId: SCHOOL_A, role: "TEACHER", assignedClassIds: ["class-1"] };
const caseManagerA: AppUser = { id: "cm-a", schoolId: SCHOOL_A, role: "CASE_MANAGER", assignedClassIds: [], approvedForSensitiveCaseNotes: true };
const orphanUser: AppUser = { id: "orphan", schoolId: undefined, role: "SCHOOL_ADMIN", assignedClassIds: [] };

// Mixed records from both schools
const schoolAStudents = [
  { id: "s1", schoolId: SCHOOL_A, name: "Aye Chan" },
  { id: "s2", schoolId: SCHOOL_A, name: "Min Thu" },
  { id: "s3", schoolId: SCHOOL_A, name: "Nilar Win" },
];
const schoolBStudents = [
  { id: "s4", schoolId: SCHOOL_B, name: "Layla Ahmed" },
  { id: "s5", schoolId: SCHOOL_B, name: "Omar Hassan" },
];
const allStudents = [...schoolAStudents, ...schoolBStudents];

// ─── assertTenantAccess ───────────────────────────────────────────────────────

describe("assertTenantAccess", () => {
  it("allows SUPER_ADMIN to access any school", () => {
    assert.doesNotThrow(() => assertTenantAccess(superAdmin, SCHOOL_A));
    assert.doesNotThrow(() => assertTenantAccess(superAdmin, SCHOOL_B));
  });

  it("allows a scoped SUPER_ADMIN to access any school", () => {
    assert.doesNotThrow(() => assertTenantAccess(superAdminScoped, SCHOOL_B));
  });

  it("allows user to access their own school", () => {
    assert.doesNotThrow(() => assertTenantAccess(adminA, SCHOOL_A));
    assert.doesNotThrow(() => assertTenantAccess(teacherA, SCHOOL_A));
    assert.doesNotThrow(() => assertTenantAccess(caseManagerA, SCHOOL_A));
  });

  it("blocks user from accessing a different school", () => {
    assert.throws(() => assertTenantAccess(adminA, SCHOOL_B), TenantAccessError);
    assert.throws(() => assertTenantAccess(adminB, SCHOOL_A), TenantAccessError);
    assert.throws(() => assertTenantAccess(teacherA, SCHOOL_B), TenantAccessError);
  });

  it("blocks user with no schoolId from accessing any school", () => {
    assert.throws(() => assertTenantAccess(orphanUser, SCHOOL_A), TenantAccessError);
    assert.throws(() => assertTenantAccess(orphanUser, SCHOOL_B), TenantAccessError);
  });

  it("error has statusCode 403", () => {
    try {
      assertTenantAccess(adminA, SCHOOL_B);
      assert.fail("Expected TenantAccessError");
    } catch (err) {
      assert.ok(err instanceof TenantAccessError);
      assert.equal(err.statusCode, 403);
    }
  });
});

// ─── filterToTenant ───────────────────────────────────────────────────────────

describe("filterToTenant — safety-net post-fetch filtering", () => {
  it("returns only the user's school records", () => {
    const result = filterToTenant(adminA, allStudents);
    assert.equal(result.length, 3);
    assert.ok(result.every((r) => r.schoolId === SCHOOL_A));
  });

  it("returns all records for SUPER_ADMIN (no filter applied)", () => {
    const result = filterToTenant(superAdmin, allStudents);
    assert.equal(result.length, 5);
  });

  it("School B admin cannot see School A records", () => {
    const result = filterToTenant(adminB, allStudents);
    assert.ok(!result.some((r) => r.schoolId === SCHOOL_A));
    assert.equal(result.length, 2);
    assert.ok(result.every((r) => r.schoolId === SCHOOL_B));
  });

  it("returns empty array for user with no schoolId", () => {
    const result = filterToTenant(orphanUser, allStudents);
    assert.equal(result.length, 0);
  });

  it("handles empty input", () => {
    const result = filterToTenant(adminA, []);
    assert.equal(result.length, 0);
  });
});

// ─── tenantFilter ─────────────────────────────────────────────────────────────

describe("tenantFilter — Prisma where-clause helper", () => {
  it("returns the user's schoolId as a where filter", () => {
    assert.deepEqual(tenantFilter(adminA), { schoolId: SCHOOL_A });
    assert.deepEqual(tenantFilter(teacherA), { schoolId: SCHOOL_A });
  });

  it("SUPER_ADMIN with explicit schoolId returns that schoolId", () => {
    assert.deepEqual(tenantFilter(superAdmin, SCHOOL_B), { schoolId: SCHOOL_B });
  });

  it("SUPER_ADMIN without explicit schoolId uses user.schoolId if present", () => {
    assert.deepEqual(tenantFilter(superAdminScoped), { schoolId: SCHOOL_A });
  });

  it("non-SUPER_ADMIN ignores explicit schoolId override (prevents override attack)", () => {
    // adminA tries to pass School B's ID — must still get their own schoolId
    const filter = tenantFilter(adminA, SCHOOL_B);
    assert.equal(filter.schoolId, SCHOOL_A);
    assert.notEqual(filter.schoolId, SCHOOL_B);
  });

  it("throws for user with no schoolId and no explicit override", () => {
    assert.throws(() => tenantFilter(orphanUser), TenantAccessError);
  });

  it("throws for SUPER_ADMIN with no schoolId and no explicit override", () => {
    assert.throws(() => tenantFilter(superAdmin), TenantAccessError);
  });
});

// ─── resolveSchoolId ──────────────────────────────────────────────────────────

describe("resolveSchoolId", () => {
  it("returns user schoolId for regular roles", () => {
    assert.equal(resolveSchoolId(adminA), SCHOOL_A);
    assert.equal(resolveSchoolId(teacherA), SCHOOL_A);
  });

  it("returns explicit schoolId for SUPER_ADMIN", () => {
    assert.equal(resolveSchoolId(superAdmin, SCHOOL_B), SCHOOL_B);
  });

  it("returns user.schoolId for scoped SUPER_ADMIN when no explicit passed", () => {
    assert.equal(resolveSchoolId(superAdminScoped), SCHOOL_A);
  });

  it("throws for SUPER_ADMIN with no schoolId and no explicit", () => {
    assert.throws(() => resolveSchoolId(superAdmin), TenantAccessError);
  });

  it("throws for user with no schoolId", () => {
    assert.throws(() => resolveSchoolId(orphanUser), TenantAccessError);
  });
});

// ─── assertResourceBelongsToTenant ───────────────────────────────────────────

describe("assertResourceBelongsToTenant", () => {
  it("passes when resource belongs to user's school", () => {
    assert.doesNotThrow(() =>
      assertResourceBelongsToTenant(adminA, { schoolId: SCHOOL_A })
    );
  });

  it("throws when resource belongs to a different school", () => {
    assert.throws(
      () => assertResourceBelongsToTenant(adminA, { schoolId: SCHOOL_B }),
      TenantAccessError
    );
  });

  it("throws when resource is null (record not found)", () => {
    assert.throws(
      () => assertResourceBelongsToTenant(adminA, null),
      TenantAccessError
    );
  });

  it("throws when resource is undefined", () => {
    assert.throws(
      () => assertResourceBelongsToTenant(adminA, undefined),
      TenantAccessError
    );
  });

  it("allows SUPER_ADMIN to access any school resource", () => {
    assert.doesNotThrow(() =>
      assertResourceBelongsToTenant(superAdmin, { schoolId: SCHOOL_B })
    );
    assert.doesNotThrow(() =>
      assertResourceBelongsToTenant(superAdmin, { schoolId: SCHOOL_A })
    );
  });
});

// ─── requireSuperAdmin ────────────────────────────────────────────────────────

describe("requireSuperAdmin", () => {
  it("does not throw for SUPER_ADMIN", () => {
    assert.doesNotThrow(() => requireSuperAdmin(superAdmin));
    assert.doesNotThrow(() => requireSuperAdmin(superAdminScoped));
  });

  it("throws for all non-SUPER_ADMIN roles", () => {
    for (const user of [adminA, adminB, teacherA, caseManagerA, orphanUser]) {
      assert.throws(() => requireSuperAdmin(user), TenantAccessError, `Expected throw for ${user.role}`);
    }
  });
});

// ─── isSuperAdmin ─────────────────────────────────────────────────────────────

describe("isSuperAdmin", () => {
  it("returns true only for SUPER_ADMIN role", () => {
    assert.equal(isSuperAdmin(superAdmin), true);
    assert.equal(isSuperAdmin(superAdminScoped), true);
    assert.equal(isSuperAdmin(adminA), false);
    assert.equal(isSuperAdmin(teacherA), false);
    assert.equal(isSuperAdmin(caseManagerA), false);
  });
});

// ─── Cross-school data leak scenarios ────────────────────────────────────────

describe("Cross-school data leak prevention", () => {
  it("School B admin cannot access School A student records by ID", () => {
    const student = allStudents.find((s) => s.id === "s1")!; // belongs to School A
    assert.throws(
      () => assertResourceBelongsToTenant(adminB, student, "Student"),
      TenantAccessError
    );
  });

  it("School A admin cannot access School B student records by ID", () => {
    const student = allStudents.find((s) => s.id === "s4")!; // belongs to School B
    assert.throws(
      () => assertResourceBelongsToTenant(adminA, student, "Student"),
      TenantAccessError
    );
  });

  it("filterToTenant strips all cross-school records from a mixed query result", () => {
    // Simulate a query that accidentally returned records from both schools
    const leakyQueryResult = allStudents; // both schools
    const safeForAdminA = filterToTenant(adminA, leakyQueryResult);
    const safeForAdminB = filterToTenant(adminB, leakyQueryResult);

    assert.ok(safeForAdminA.every((r) => r.schoolId === SCHOOL_A), "Admin A sees only School A");
    assert.ok(safeForAdminB.every((r) => r.schoolId === SCHOOL_B), "Admin B sees only School B");
    assert.ok(!safeForAdminA.some((r) => r.schoolId === SCHOOL_B), "No School B leak to Admin A");
    assert.ok(!safeForAdminB.some((r) => r.schoolId === SCHOOL_A), "No School A leak to Admin B");
  });

  it("tenantFilter override attack is neutralised", () => {
    // A malicious School A admin tries to inject School B's ID into tenantFilter
    const filter = tenantFilter(adminA, SCHOOL_B);
    assert.equal(
      filter.schoolId,
      SCHOOL_A,
      "Filter must return user's own schoolId, never the attacker-supplied value"
    );
  });

  it("a user who lost their school assignment gets zero records", () => {
    const deprovisioned: AppUser = { id: "ex-admin", schoolId: undefined, role: "SCHOOL_ADMIN", assignedClassIds: [] };
    const result = filterToTenant(deprovisioned, allStudents);
    assert.equal(result.length, 0);
  });

  it("SUPER_ADMIN cross-school access is intentional and explicit", () => {
    // Super admin can reach School A
    assert.doesNotThrow(() => assertTenantAccess(superAdmin, SCHOOL_A));
    // Super admin can reach School B
    assert.doesNotThrow(() => assertTenantAccess(superAdmin, SCHOOL_B));
    // But they still see all records (intended cross-school visibility)
    assert.equal(filterToTenant(superAdmin, allStudents).length, 5);
  });
});
