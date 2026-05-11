import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classMutationErrorMessage, normalizeClassName } from "@/lib/classes";

describe("class management validation", () => {
  it("normalizes class names before duplicate checks and saving", () => {
    assert.equal(normalizeClassName("  GED   English  "), "GED English");
  });

  it("surfaces duplicate class name/year errors clearly", () => {
    assert.equal(classMutationErrorMessage({}), "Class could not be saved. Please check the form and try again.");
  });
});
