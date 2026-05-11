# Bug Fix Report

Audit date: 2026-05-11

## Fixed bugs

### 1. Super Admin logout missing
- Root cause: `app/super-admin/layout.tsx` rendered navigation without the shared logout server action and did not validate a fresh active user before rendering.
- Files changed: `app/super-admin/layout.tsx`, `lib/logout-source.test.ts`.
- Manual browser test: Login as `SUPER_ADMIN`, confirm `Log out` appears in the top bar, click it, verify redirect to `/login`, then visit `/super-admin` directly and verify it redirects/blocks without login.

### 2. Video lesson dropdowns empty and create action not persisted
- Root cause: video pages/actions and `lib/videos.ts` used static demo users/classes/subjects/lessons/progress instead of Prisma and the current session.
- Files changed: `lib/videos.ts`, `app/dashboard/videos/page.tsx`, `app/dashboard/videos/new/page.tsx`, `app/dashboard/videos/[id]/page.tsx`, `app/dashboard/videos/actions.ts`.
- Manual browser test: Login as teacher and school admin; verify class/subject dropdowns reflect DB records, teacher sees only assigned classes, school admin sees all own-school classes, and creating a video persists after refresh.

### 3. Case Support student dropdown empty
- Root cause: support page and helper module read demo arrays and `demoCurrentUser`, so real tenant students/notes/referrals/support/reminders never populated.
- Files changed: `lib/support.ts`, `app/dashboard/support/page.tsx`, `lib/support.test.ts`.
- Manual browser test: Login as case manager, school admin, and teacher; verify each sees only visible real students and support records. Verify unauthorized sensitive notes are redacted.

### 4. School Admin branding save did not write to DB
- Root cause: branding settings page used demo branding/current user, while action only validated and redirected.
- Files changed: `app/dashboard/settings/branding/page.tsx`, `app/dashboard/settings/branding/actions.ts`.
- Manual browser test: Login as school admin, edit school branding/contact fields, save, refresh, and verify values persist. Login as teacher/student and verify the route/nav is unavailable.

### 5. Duplicate React keys in library badges
- Root cause: book badges keyed by the display label, so `subject === language` could duplicate keys.
- Files changed: `app/dashboard/library/page.tsx`, `app/dashboard/library/[id]/page.tsx`.
- Manual browser test: Open library pages with a book whose subject/language match and confirm no duplicate-key warning in console.

### 6. Users & Access module missing
- Root cause: RBAC allowed `users:manage`, but `/dashboard/access-control` was only static role badges with no CRUD/action layer.
- Files changed: `lib/users.ts`, `app/dashboard/users/**`, `app/dashboard/access-control/page.tsx`, `lib/navigation.ts`, `lib/users.test.ts`.
- Manual browser test: Login as school admin, open Users & Access, create teacher/case manager/student-linked account, assign classes, reset password, deactivate/reactivate, and verify teacher cannot see nav or access the route.

### 7. Production demo import cleanup
- Root cause: authenticated pages retained legacy compatibility imports.
- Files changed: video/support/branding/super-admin pages and `lib/production-imports.test.ts`.
- Manual browser test: Navigate the affected pages under real accounts and verify no demo placeholder data appears.

## Demo/legacy imports removed
- `demoCurrentUser` removed from video, support, and branding pages/actions.
- `demoSchoolBranding` removed from branding and super-admin pages.
- `demoClasses`, `demoStudents`, `demoVideoSubjects`, `demoVideoLessons`, and `demoVideoProgress` removed from production video helpers/pages.
- `demoCaseNotes`, `demoSponsorSupports`, `demoReferrals`, and `demoDocumentReminders` removed from production support reads.

## Remaining demo-only files intentionally kept
- `lib/students.ts`: compatibility exports (`demoCurrentUser`, `demoClasses`, `demoStudents`) retained only for legacy/test isolation and are blocked from audited production pages.
- `lib/branding.ts`: `demoSchoolBranding` retained as a default branding compatibility constant, not used by authenticated branding/super-admin pages.
- `lib/support.ts`: empty demo arrays retained as compatibility exports only; support reads are Prisma-backed.

## Manual tests still required
- Full browser verification against a seeded PostgreSQL database.
- Google Fonts/network-available production build verification.
- End-to-end user CRUD with login attempts using reset temporary passwords.
