import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { activeEnrollmentInvariant, planEnrollment, startOfUtcDay } from "@/lib/enrollments";

describe("enrollment duplicate protection", () => {
  it("plans an initial enrollment when no active row exists", () => {
    assert.deepEqual(planEnrollment(null, "class-a"), { type: "initial", message: "Student enrolled successfully" });
  });

  it("plans a transfer to a different class", () => {
    assert.deepEqual(planEnrollment({ id: "enrollment-a", classId: "class-a" }, "class-b"), { type: "transfer", transferEnrollmentId: "enrollment-a", message: "Student transferred successfully" });
  });

  it("blocks repeated submit to the same active class", () => {
    assert.deepEqual(planEnrollment({ id: "enrollment-a", classId: "class-a" }, "class-a"), { type: "same-class", message: "Student is already enrolled in this class" });
  });

  it("normalizes duplicate-click requests to a single start date per UTC day", () => {
    assert.equal(startOfUtcDay(new Date("2026-05-11T23:59:59.000Z")).toISOString(), "2026-05-11T00:00:00.000Z");
    assert.equal(startOfUtcDay(new Date("2026-05-11T00:00:01.000Z")).toISOString(), "2026-05-11T00:00:00.000Z");
  });

  it("detects the one ACTIVE enrollment invariant", () => {
    assert.equal(activeEnrollmentInvariant([{ status: "ACTIVE" }, { status: "TRANSFERRED" }]), true);
    assert.equal(activeEnrollmentInvariant([{ status: "ACTIVE" }, { status: "ACTIVE" }]), false);
  });
});
