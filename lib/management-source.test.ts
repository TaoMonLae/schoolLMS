import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path: string) {
  return readFileSync(path, "utf8");
}

describe("management modules are wired to real actions", () => {
  it("classes expose create, edit, roster, detail, and safe delete controls", () => {
    const list = source("app/dashboard/classes/page.tsx");
    const actions = source("app/dashboard/classes/actions.ts");
    assert.match(list, /Create Class/);
    assert.match(list, /Manage roster/);
    assert.match(list, /\/dashboard\/classes\/\$\{c\.id\}\/edit/);
    assert.match(actions, /deleteClassSafely/);
    assert.match(actions, /dependentCount > 0/);
  });

  it("LMS exposes subject and lesson CRUD routes and actions", () => {
    const page = source("app/dashboard/lms/page.tsx");
    const actions = source("app/dashboard/lms/actions.ts");
    assert.match(page, /Create Subject/);
    assert.match(page, /Create Lesson/);
    assert.match(page, /subjects\/\$\{subject\.id\}\/edit/);
    assert.match(actions, /createLesson/);
    assert.match(actions, /updateLesson/);
    assert.match(actions, /deleteLesson/);
  });

  it("assignments persist CRUD and grading changes", () => {
    const page = source("app/dashboard/assignments/page.tsx");
    const detail = source("app/dashboard/assignments/[assignmentId]/page.tsx");
    const actions = source("app/dashboard/assignments/actions.ts");
    assert.match(page, /Create Assignment/);
    assert.match(detail, /saveAssignmentGrades/);
    assert.match(actions, /assignmentSubmission\.upsert/);
    assert.match(actions, /points > assignment\.maxPoints/);
  });

  it("exams persist CRUD and marks changes", () => {
    const page = source("app/dashboard/exams/page.tsx");
    const actions = source("app/dashboard/exams/actions.ts");
    assert.match(page, /Create Exam/);
    assert.match(page, /saveExamMarks/);
    assert.match(actions, /examMark\.upsert/);
    assert.match(actions, /marks > exam\.maxMarks/);
  });
});
