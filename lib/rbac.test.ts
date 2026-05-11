/**
 * lib/rbac.test.ts — Role-based access control tests
 * ─────────────────────────────────────────────────────
 * Run with: npx tsx --test lib/rbac.test.ts
 *
 * Verifies that every role has exactly the permissions it should have
 * (and does NOT have the permissions it shouldn't).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hasPermission,
  canManageStudents,
  canViewSensitiveStudentDocuments,
  canManageSensitiveStudentDocuments,
  canTakeAttendance,
  canEditAttendance,
  canViewLibrary,
  canUploadLibraryBooks,
  canViewVideos,
  canUploadVideos,
  canManageLms,
  canManageGrades,
  canManageBranding,
  canViewSupport,
  canManageSupport,
  rolePermissions,
} from "./rbac.js";
import type { Role } from "./types.js";

const ALL_ROLES: Role[] = ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "STUDENT", "CASE_MANAGER"];

// ── SUPER_ADMIN ───────────────────────────────────────────────────────────────

describe("SUPER_ADMIN", () => {
  it("has wildcard permission", () => {
    assert.ok(rolePermissions.SUPER_ADMIN.includes("*"));
  });

  it("passes hasPermission for any permission string", () => {
    assert.ok(hasPermission("SUPER_ADMIN", "school:manage"));
    assert.ok(hasPermission("SUPER_ADMIN", "students:manage"));
    assert.ok(hasPermission("SUPER_ADMIN", "support:sensitive:manage"));
    assert.ok(hasPermission("SUPER_ADMIN", "any:random:permission"));
  });

  it("can manage students", () => assert.ok(canManageStudents("SUPER_ADMIN")));
  it("can view sensitive documents", () => assert.ok(canViewSensitiveStudentDocuments("SUPER_ADMIN")));
  it("can manage sensitive documents", () => assert.ok(canManageSensitiveStudentDocuments("SUPER_ADMIN")));
  it("can take attendance", () => assert.ok(canTakeAttendance("SUPER_ADMIN")));
  it("can edit attendance", () => assert.ok(canEditAttendance("SUPER_ADMIN")));
  it("can view library", () => assert.ok(canViewLibrary("SUPER_ADMIN")));
  it("can upload library books", () => assert.ok(canUploadLibraryBooks("SUPER_ADMIN")));
  it("can view videos", () => assert.ok(canViewVideos("SUPER_ADMIN")));
  it("can upload videos", () => assert.ok(canUploadVideos("SUPER_ADMIN")));
  it("can manage LMS", () => assert.ok(canManageLms("SUPER_ADMIN")));
  it("can manage grades", () => assert.ok(canManageGrades("SUPER_ADMIN")));
  it("can manage branding", () => assert.ok(canManageBranding("SUPER_ADMIN")));
  it("can view support", () => assert.ok(canViewSupport("SUPER_ADMIN")));
  it("can manage support", () => assert.ok(canManageSupport("SUPER_ADMIN")));
});

// ── SCHOOL_ADMIN ──────────────────────────────────────────────────────────────

describe("SCHOOL_ADMIN", () => {
  it("can manage students", () => assert.ok(canManageStudents("SCHOOL_ADMIN")));
  it("can view sensitive documents", () => assert.ok(canViewSensitiveStudentDocuments("SCHOOL_ADMIN")));
  it("can manage sensitive documents", () => assert.ok(canManageSensitiveStudentDocuments("SCHOOL_ADMIN")));
  it("can take attendance", () => assert.ok(canTakeAttendance("SCHOOL_ADMIN")));
  it("can edit attendance", () => assert.ok(canEditAttendance("SCHOOL_ADMIN")));
  it("can view library", () => assert.ok(canViewLibrary("SCHOOL_ADMIN")));
  it("can upload library books", () => assert.ok(canUploadLibraryBooks("SCHOOL_ADMIN")));
  it("can view videos", () => assert.ok(canViewVideos("SCHOOL_ADMIN")));
  it("can upload videos", () => assert.ok(canUploadVideos("SCHOOL_ADMIN")));
  it("can manage LMS", () => assert.ok(canManageLms("SCHOOL_ADMIN")));
  it("can manage grades", () => assert.ok(canManageGrades("SCHOOL_ADMIN")));
  it("can manage branding", () => assert.ok(canManageBranding("SCHOOL_ADMIN")));
  it("can view support", () => assert.ok(canViewSupport("SCHOOL_ADMIN")));
  it("can manage support", () => assert.ok(canManageSupport("SCHOOL_ADMIN")));

  // Negative checks — SCHOOL_ADMIN should not have wildcard
  it("does NOT have wildcard permission", () => {
    assert.ok(!rolePermissions.SCHOOL_ADMIN.includes("*"));
  });
});

// ── TEACHER ───────────────────────────────────────────────────────────────────

describe("TEACHER", () => {
  it("can read students", () => assert.ok(hasPermission("TEACHER", "students:read")));
  it("can take attendance", () => assert.ok(canTakeAttendance("TEACHER")));
  it("can view library", () => assert.ok(canViewLibrary("TEACHER")));
  it("can upload library books", () => assert.ok(canUploadLibraryBooks("TEACHER")));
  it("can view videos", () => assert.ok(canViewVideos("TEACHER")));
  it("can upload videos", () => assert.ok(canUploadVideos("TEACHER")));
  it("can manage LMS", () => assert.ok(canManageLms("TEACHER")));
  it("can manage grades", () => assert.ok(canManageGrades("TEACHER")));
  it("can view support", () => assert.ok(canViewSupport("TEACHER")));

  // Negative checks
  it("cannot manage students", () => assert.ok(!canManageStudents("TEACHER")));
  it("cannot view sensitive documents", () => assert.ok(!canViewSensitiveStudentDocuments("TEACHER")));
  it("cannot manage sensitive documents", () => assert.ok(!canManageSensitiveStudentDocuments("TEACHER")));
  it("cannot edit attendance (only take)", () => assert.ok(!canEditAttendance("TEACHER")));
  it("cannot manage branding", () => assert.ok(!canManageBranding("TEACHER")));
  it("cannot manage support", () => assert.ok(!canManageSupport("TEACHER")));
  it("cannot manage schools", () => assert.ok(!hasPermission("TEACHER", "school:manage")));
  it("cannot manage users", () => assert.ok(!hasPermission("TEACHER", "users:manage")));
});

// ── STUDENT ───────────────────────────────────────────────────────────────────

describe("STUDENT", () => {
  it("can read their own profile", () => assert.ok(hasPermission("STUDENT", "profile:read")));
  it("can read classes", () => assert.ok(hasPermission("STUDENT", "classes:read")));
  it("can read attendance", () => assert.ok(hasPermission("STUDENT", "attendance:read")));
  it("can view library", () => assert.ok(canViewLibrary("STUDENT")));
  it("can view videos", () => assert.ok(canViewVideos("STUDENT")));
  it("can read LMS", () => assert.ok(hasPermission("STUDENT", "lms:read")));
  it("can read grades", () => assert.ok(hasPermission("STUDENT", "grades:read")));

  // Negative checks — students must NOT be able to do admin or staff tasks
  it("cannot manage students", () => assert.ok(!canManageStudents("STUDENT")));
  it("cannot take/manage attendance", () => assert.ok(!canTakeAttendance("STUDENT")));
  it("cannot upload library books", () => assert.ok(!canUploadLibraryBooks("STUDENT")));
  it("cannot upload videos", () => assert.ok(!canUploadVideos("STUDENT")));
  it("cannot manage LMS", () => assert.ok(!canManageLms("STUDENT")));
  it("cannot manage grades", () => assert.ok(!canManageGrades("STUDENT")));
  it("cannot manage branding", () => assert.ok(!canManageBranding("STUDENT")));
  it("cannot view support", () => assert.ok(!canViewSupport("STUDENT")));
  it("cannot manage support", () => assert.ok(!canManageSupport("STUDENT")));
  it("cannot view sensitive documents", () => assert.ok(!canViewSensitiveStudentDocuments("STUDENT")));
  it("cannot manage school", () => assert.ok(!hasPermission("STUDENT", "school:manage")));
  it("cannot manage users", () => assert.ok(!hasPermission("STUDENT", "users:manage")));
  it("cannot access super-admin routes (no wildcard)", () => {
    assert.ok(!rolePermissions.STUDENT.includes("*"));
  });
});

// ── CASE_MANAGER ──────────────────────────────────────────────────────────────

describe("CASE_MANAGER", () => {
  it("can read students", () => assert.ok(hasPermission("CASE_MANAGER", "students:read")));
  it("can view sensitive documents", () => assert.ok(canViewSensitiveStudentDocuments("CASE_MANAGER")));
  it("can view support", () => assert.ok(canViewSupport("CASE_MANAGER")));
  it("can manage support (cases)", () => assert.ok(canManageSupport("CASE_MANAGER")));
  it("can manage cases", () => assert.ok(hasPermission("CASE_MANAGER", "cases:manage")));
  it("can view library", () => assert.ok(canViewLibrary("CASE_MANAGER")));
  it("can view videos", () => assert.ok(canViewVideos("CASE_MANAGER")));
  it("can read LMS", () => assert.ok(hasPermission("CASE_MANAGER", "lms:read")));
  it("can read grades", () => assert.ok(hasPermission("CASE_MANAGER", "grades:read")));
  it("can read attendance", () => assert.ok(hasPermission("CASE_MANAGER", "attendance:read")));

  // Negative checks
  it("cannot manage students (read-only)", () => assert.ok(!canManageStudents("CASE_MANAGER")));
  it("cannot manage sensitive documents", () => assert.ok(!canManageSensitiveStudentDocuments("CASE_MANAGER")));
  it("cannot take attendance", () => assert.ok(!canTakeAttendance("CASE_MANAGER")));
  it("cannot edit attendance", () => assert.ok(!canEditAttendance("CASE_MANAGER")));
  it("cannot upload library books", () => assert.ok(!canUploadLibraryBooks("CASE_MANAGER")));
  it("cannot upload videos", () => assert.ok(!canUploadVideos("CASE_MANAGER")));
  it("cannot manage LMS", () => assert.ok(!canManageLms("CASE_MANAGER")));
  it("cannot manage grades", () => assert.ok(!canManageGrades("CASE_MANAGER")));
  it("cannot manage branding", () => assert.ok(!canManageBranding("CASE_MANAGER")));
  it("cannot manage school", () => assert.ok(!hasPermission("CASE_MANAGER", "school:manage")));
});

// ── Role exhaustiveness ───────────────────────────────────────────────────────

describe("rolePermissions exhaustiveness", () => {
  it("has an entry for every Role enum value", () => {
    for (const role of ALL_ROLES) {
      assert.ok(
        Array.isArray(rolePermissions[role]),
        `Missing permissions array for role: ${role}`
      );
    }
  });

  it("no role has an empty permissions array", () => {
    for (const role of ALL_ROLES) {
      assert.ok(
        rolePermissions[role].length > 0,
        `Role ${role} has no permissions`
      );
    }
  });

  it("only SUPER_ADMIN has the wildcard permission", () => {
    for (const role of ALL_ROLES) {
      if (role === "SUPER_ADMIN") {
        assert.ok(rolePermissions[role].includes("*"), "SUPER_ADMIN must have *");
      } else {
        assert.ok(!rolePermissions[role].includes("*"), `Role ${role} must NOT have *`);
      }
    }
  });
});

// ── Privilege escalation guard ────────────────────────────────────────────────

describe("privilege escalation prevention", () => {
  const privilegedPermissions = [
    "school:manage",
    "users:manage",
    "branding:manage",
    "support:sensitive:manage",
    "students:documents:manage",
  ];

  const unprivilegedRoles: Role[] = ["TEACHER", "STUDENT", "CASE_MANAGER"];

  for (const role of unprivilegedRoles) {
    for (const permission of privilegedPermissions) {
      it(`${role} cannot ${permission}`, () => {
        assert.ok(
          !hasPermission(role, permission),
          `${role} should NOT have ${permission}`
        );
      });
    }
  }
});
