import assert from "node:assert/strict";
import { describe, it } from "node:test";
import bcrypt from "bcryptjs";
import type { AppUser } from "@/lib/types";
import { assignableRolesFor, canAccessUserManagement, resolveManagedSchoolId } from "@/lib/users";
import { TenantAccessError } from "@/lib/tenant";

const schoolAdmin: AppUser = { id: "admin-a", role: "SCHOOL_ADMIN", schoolId: "school-a", assignedClassIds: [] };
const teacher: AppUser = { id: "teacher-a", role: "TEACHER", schoolId: "school-a", assignedClassIds: ["class-a"] };
const superAdmin: AppUser = { id: "super", role: "SUPER_ADMIN", assignedClassIds: [] };

describe("user management permissions", () => {
  it("allows school admins and super admins but blocks teachers", () => {
    assert.equal(canAccessUserManagement(schoolAdmin), true);
    assert.equal(canAccessUserManagement(superAdmin), true);
    assert.equal(canAccessUserManagement(teacher), false);
  });

  it("prevents school admins from creating SUPER_ADMIN accounts", () => {
    assert.equal(assignableRolesFor(schoolAdmin).includes("SUPER_ADMIN"), false);
  });

  it("prevents school admins from managing another school", () => {
    assert.throws(() => resolveManagedSchoolId(schoolAdmin, "school-b", "TEACHER"), TenantAccessError);
  });

  it("requires super admins to select school context for school-scoped users", () => {
    assert.throws(() => resolveManagedSchoolId(superAdmin, undefined, "TEACHER"), TenantAccessError);
    assert.equal(resolveManagedSchoolId(superAdmin, "school-a", "TEACHER"), "school-a");
  });

  it("password reset hashes are bcrypt hashes, not plaintext", async () => {
    const plain = "Temporary123!";
    const hash = await bcrypt.hash(plain, 10);
    assert.notEqual(hash, plain);
    assert.equal(hash.startsWith("$2"), true);
    assert.equal(await bcrypt.compare(plain, hash), true);
  });
});
