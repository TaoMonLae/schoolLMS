# Integration Audit

Audit date: 2026-05-11

## Demo/static placeholders found

- `demoStudents`, `demoClasses`, and `demoCurrentUser` were concentrated in student, attendance, LMS, video, support, and several dashboard pages.
- `demoSchoolBranding` was used for login, dashboard layout/sidebar, attendance exports, report-card exports, settings, and super-admin fallback screens.
- Static in-memory LMS, library, attendance, and video arrays existed in `lib/lms.ts`, `lib/library.ts`, `lib/attendance.ts`, and `lib/videos.ts`.

## Work completed

- Added authenticated DB-backed current-user resolution through `getCurrentUser()` / `getRequiredCurrentUser()`, refreshing role, school, teacher class assignments, student link, and case approval from Prisma instead of trusting stale cookie fields alone.
- Connected login form to a server action that validates a real `User` record and writes the session cookie.
- Replaced student list/detail/filter helpers with Prisma queries scoped by `schoolId`, active enrollment, role, and soft-delete state.
- Added student create, update, class-transfer enrollment, and soft-delete server actions.
- Replaced attendance helpers with Prisma-backed class/student/attendance queries and a bulk upsert action keyed by the schema unique constraint to prevent duplicate daily rows.
- Connected dashboard and shell branding/stat cards to active `School` records and live attendance.
- Added class creation/teacher assignment UI and enrollment transfer UI backed by Prisma.
- Replaced LMS helper data for subjects, lessons, assignments, submissions, exams, and report cards with Prisma reads.
- Replaced library list/detail/download helper data with Prisma reads; upload validation remains wired, while object storage is explicitly marked not implemented.

## Tenant isolation checks

- School-scoped query helpers use `tenantFilter(user)` or role-specific filters derived from it.
- Student access applies school, role, teacher class, student-self, active enrollment, and `deletedAt: null` filters.
- Attendance writes derive the school id from the authenticated user and only save rows for students visible in the selected class.
- Class and enrollment actions verify related teacher/student/class records belong to the authenticated user's school before write operations.

## Remaining gaps

- Video lessons still have legacy compatibility paths and require a full Prisma helper migration for all pages/actions.
- Support/case-management pages still contain legacy compatibility paths and should be migrated to Prisma case-note/referral/reminder helpers.
- Super-admin school fallback pages still reference compatibility branding for empty-state display.
- File/object storage is not implemented for library uploads, lesson files, student photos, or private video assets.
