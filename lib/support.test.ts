import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppUser } from "@/lib/types";
import { canViewSensitiveSupport, demoCaseNotes, getSensitiveAuditEvent, getVisibleCaseNotesForStudent } from "@/lib/support";

const teacher: AppUser = {
  id: "teacher-test",
  schoolId: "seed-school-mon-rlc",
  role: "TEACHER",
  assignedClassIds: ["class-primary-a"]
};

const unapprovedCaseManager: AppUser = {
  id: "case-manager-test",
  schoolId: "seed-school-mon-rlc",
  role: "CASE_MANAGER",
  assignedClassIds: [],
  approvedForSensitiveCaseNotes: false
};

const approvedCaseManager: AppUser = {
  id: "approved-case-manager-test",
  schoolId: "seed-school-mon-rlc",
  role: "CASE_MANAGER",
  assignedClassIds: [],
  approvedForSensitiveCaseNotes: true
};

describe("refugee support sensitive note access", () => {
  it("redacts sensitive note content for teachers", () => {
    const notes = getVisibleCaseNotesForStudent(teacher, "student-aye-chan");
    const sensitive = notes.find((note) => note.sensitivity === "SENSITIVE");

    assert.equal(canViewSensitiveSupport(teacher), false);
    assert.equal(sensitive?.redacted, true);
    assert.equal(sensitive?.note, undefined);
  });

  it("redacts sensitive note content for unapproved case managers", () => {
    const notes = getVisibleCaseNotesForStudent(unapprovedCaseManager, "student-aye-chan");
    const sensitive = notes.find((note) => note.sensitivity === "SENSITIVE");

    assert.equal(canViewSensitiveSupport(unapprovedCaseManager), false);
    assert.equal(sensitive?.redacted, true);
    assert.equal(sensitive?.note, undefined);
  });

  it("allows approved case managers to view sensitive note content", () => {
    const notes = getVisibleCaseNotesForStudent(approvedCaseManager, "student-aye-chan");
    const sensitive = notes.find((note) => note.sensitivity === "SENSITIVE");

    assert.equal(canViewSensitiveSupport(approvedCaseManager), true);
    assert.equal(sensitive?.redacted, false);
    assert.match(sensitive?.note || "", /Sensitive family situation/);
  });

  it("audit events never include sensitive note content", () => {
    const sensitive = demoCaseNotes.find((note) => note.sensitivity === "SENSITIVE");
    assert.ok(sensitive);

    const audit = getSensitiveAuditEvent(approvedCaseManager, sensitive, "VIEW");
    const serialized = JSON.stringify(audit);

    assert.equal(audit.metadata.contentLogged, false);
    assert.equal(serialized.includes(sensitive.note), false);
  });
});
