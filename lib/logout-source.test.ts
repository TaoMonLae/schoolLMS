import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("logout route protection source checks", () => {
  it("logout action deletes the session cookie and redirects to login", () => {
    const source = readFileSync(join(process.cwd(), "app/logout/actions.ts"), "utf8");
    assert.match(source, /cookieStore\.delete\(SESSION_COOKIE\)/);
    assert.match(source, /redirect\("\/login"\)/);
  });

  it("super-admin layout requires an active SUPER_ADMIN session", () => {
    const source = readFileSync(join(process.cwd(), "app/super-admin/layout.tsx"), "utf8");
    assert.match(source, /getCurrentUser\(\)/);
    assert.match(source, /redirect\("\/login"\)/);
    assert.match(source, /currentUser\.role !== "SUPER_ADMIN"/);
  });
});
