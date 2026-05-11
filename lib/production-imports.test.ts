import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const forbidden = ["demoCurrentUser", "demoSchoolBranding", "demoStudents", "demoClasses", "demoVideoSubjects", "demoVideoLessons", "demoVideoProgress", "demoCaseNotes", "demoSponsorSupports", "demoReferrals", "demoDocumentReminders"];
const productionFiles = [
  "app/dashboard/videos/page.tsx",
  "app/dashboard/videos/new/page.tsx",
  "app/dashboard/videos/actions.ts",
  "app/dashboard/support/page.tsx",
  "app/dashboard/settings/branding/page.tsx",
  "app/dashboard/settings/branding/actions.ts",
  "app/super-admin/page.tsx",
  "app/super-admin/schools/page.tsx"
];

describe("production pages do not import demo helpers", () => {
  for (const file of productionFiles) {
    it(file, () => {
      const content = readFileSync(join(process.cwd(), file), "utf8");
      for (const name of forbidden) assert.equal(content.includes(name), false, `${file} contains ${name}`);
    });
  }
});
