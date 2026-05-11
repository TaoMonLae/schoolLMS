import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppUser } from "@/lib/types";
import { canAddBasicSupport, canAddSensitiveSupport, canViewSensitiveSupport, getSensitiveAuditEvent, type CaseNote } from "@/lib/support";

const teacher: AppUser = { id: "teacher-test", schoolId: "school-a", role: "TEACHER", assignedClassIds: ["class-a"] };
const unapprovedCaseManager: AppUser = { id: "case-manager-test", schoolId: "school-a", role: "CASE_MANAGER", assignedClassIds: [], approvedForSensitiveCaseNotes: false };
const approvedCaseManager: AppUser = { id: "approved-case-manager-test", schoolId: "school-a", role: "CASE_MANAGER", assignedClassIds: [], approvedForSensitiveCaseNotes: true };
const schoolAdmin: AppUser = { id: "admin-test", schoolId: "school-a", role: "SCHOOL_ADMIN", assignedClassIds: [] };
const superAdmin: AppUser = { id: "super-test", role: "SUPER_ADMIN", assignedClassIds: [] };

const sensitiveNote: CaseNote = { id: "note-sensitive", schoolId: "school-a", studentId: "student-a", authorName: "Case Manager", title: "Sensitive", note: "Private content", sensitivity: "SENSITIVE", createdAt: "2026-05-11" };

describe("refugee support sensitive note access", () => {
  it("denies sensitive note content to teachers and unapproved case managers", () => {
    assert.equal(canViewSensitiveSupport(teacher), false);
    assert.equal(canViewSensitiveSupport(unapprovedCaseManager), false);
  });

  it("allows super admins, school admins, and approved case managers", () => {
    assert.equal(canViewSensitiveSupport(superAdmin), true);
    assert.equal(canViewSensitiveSupport(schoolAdmin), true);
    assert.equal(canViewSensitiveSupport(approvedCaseManager), true);
  });

  it("allows teachers to add only basic notes for assigned students", () => {
    assert.equal(canAddBasicSupport(teacher, { id: "student-a", schoolId: "school-a", studentNumber: "MON-001", legalName: "Aye", preferredName: "Aye", gender: "NOT_SPECIFIED", status: "ACTIVE", classId: "class-a", className: "Bridge English" }), true);
    assert.equal(canAddSensitiveSupport(teacher), false);
  });

  it("allows only school admins and approved case managers to create sensitive notes", () => {
    assert.equal(canAddSensitiveSupport(schoolAdmin), true);
    assert.equal(canAddSensitiveSupport(approvedCaseManager), true);
    assert.equal(canAddSensitiveSupport(unapprovedCaseManager), false);
  });

  it("audit events never include sensitive note content", () => {
    const audit = getSensitiveAuditEvent(approvedCaseManager, sensitiveNote, "VIEW");
    const serialized = JSON.stringify(audit);
    assert.equal(audit.metadata.contentLogged, false);
    assert.equal(serialized.includes(sensitiveNote.note), false);
  });
});
