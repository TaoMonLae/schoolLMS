import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { brandingDataForPrisma, canUpdateRequestedSchoolBranding, validateSchoolBrandingForm } from "@/lib/school-branding";
import { validateSchoolLogo } from "@/lib/school-logo-storage";
import type { AppUser } from "@/lib/types";

const SCHOOL_A = "school-a";
const SCHOOL_B = "school-b";
const schoolAdmin: AppUser = { id: "admin-a", role: "SCHOOL_ADMIN", schoolId: SCHOOL_A, assignedClassIds: [] };
const teacher: AppUser = { id: "teacher-a", role: "TEACHER", schoolId: SCHOOL_A, assignedClassIds: [] };

function baseForm(overrides: Record<string, string> = {}) {
  const form = new FormData();
  const values = {
    schoolId: SCHOOL_A,
    name: "  Saved Refugee School  ",
    shortName: " SRS ",
    primaryColorText: "#123abc",
    secondaryColorText: "#abcdef",
    email: "office@example.org",
    website: "https://example.org",
    subdomain: "saved-school",
    customDomain: "portal.example.org",
    phone: "+60 11 1234 5678",
    address: "123 Learning Road",
    city: "Kuala Lumpur",
    country: "Malaysia",
    timezone: "Asia/Kuala_Lumpur",
    ...overrides
  };
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

describe("school branding authorization", () => {
  it("school admin can update own branding", () => {
    assert.equal(canUpdateRequestedSchoolBranding(schoolAdmin, SCHOOL_A), true);
  });

  it("school admin cannot update another school", () => {
    assert.equal(canUpdateRequestedSchoolBranding(schoolAdmin, SCHOOL_B), false);
  });

  it("teacher cannot update branding", () => {
    assert.equal(canUpdateRequestedSchoolBranding(teacher, SCHOOL_A), false);
  });
});

describe("school branding validation", () => {
  it("accepts valid colors and trims persisted values", () => {
    const result = validateSchoolBrandingForm(baseForm());
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.name, "Saved Refugee School");
    assert.equal(result.data.primaryColor, "#123abc");
    assert.equal(result.data.secondaryColor, "#abcdef");
  });

  it("rejects invalid colors", () => {
    const result = validateSchoolBrandingForm(baseForm({ primaryColorText: "blue" }));
    assert.equal(result.success, false);
  });

  it("converts empty optional strings to null-ready data so refresh persists clean values", () => {
    const result = validateSchoolBrandingForm(baseForm({ shortName: "   ", phone: "" }));
    assert.equal(result.success, true);
    if (!result.success) return;
    const data = brandingDataForPrisma(result.data);
    assert.equal(data.shortName, null);
    assert.equal(data.phone, null);
  });
});

describe("school logo validation", () => {
  it("accepts a valid PNG logo", () => {
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=", "base64");
    const result = validateSchoolLogo(png, "logo.png", png.length, "image/png");
    assert.deepEqual(result, { valid: true, contentType: "image/png" });
  });

  it("rejects invalid logo type/content", () => {
    const result = validateSchoolLogo(Buffer.from("not an image"), "logo.png", 12, "image/png");
    assert.equal(result.valid, false);
  });

  it("allows safe SVG logos", () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1"/></svg>');
    const result = validateSchoolLogo(svg, "logo.svg", svg.length, "image/svg+xml");
    assert.deepEqual(result, { valid: true, contentType: "image/svg+xml" });
  });
});

describe("branding application surfaces", () => {
  it("sidebar uses persisted school.logoUrl through SchoolLogo", () => {
    const source = readFileSync("components/sidebar.tsx", "utf8");
    assert.match(source, /<SchoolLogo school=\{school\}/);
  });

  it("login page uses persisted school logo and display name", () => {
    const source = readFileSync("app/login/page.tsx", "utf8");
    assert.match(source, /getFirstActiveSchoolBranding/);
    assert.match(source, /<SchoolLogo school=\{school\}/);
  });

  it("branding action supports logo replacement and removal paths", () => {
    const source = readFileSync("app/dashboard/settings/branding/actions.ts", "utf8");
    assert.match(source, /logoEvent = school\.logoUrl \? "replaced" : "uploaded"/);
    assert.match(source, /data\.logoUrl = null/);
  });
});
