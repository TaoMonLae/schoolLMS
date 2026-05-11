# Integration Audit

## Completed in this pass

- Super-admin logout is visible and uses the shared session-cookie deletion action.
- Dashboard and super-admin authenticated shells are dynamic and protected by current-user/session checks.
- Video lesson pages/actions use Prisma-backed classes, subjects, lessons, and progress records.
- Support reads use Prisma-backed students, case notes, sponsor supports, referrals, reminders, and audit previews with sensitive redaction.
- Branding settings persist school fields for authorized school admins.
- Users & Access is the operational user-management area for create/edit/status/password/class/student/case-manager workflows.
- Class management now includes create, detail, edit, teacher assignment, roster navigation, action column, and safe delete.
- LMS management now includes subject create/edit/delete-if-unused and lesson create/edit/delete.
- Assignment management now includes create/edit/delete, draft/published/closed status, detail grading, and submission upsert persistence.
- Exam management now includes create/edit/delete, draft/scheduled/completed status, and mark/feedback upsert persistence.
- Library duplicate-key risk was fixed with field-scoped keys.
- Production import tests assert audited pages do not import legacy demo helpers.

## Legacy/demo audit

The audited production pages no longer import `demoCurrentUser`, `demoSchoolBranding`, `demoStudents`, `demoClasses`, `demoVideoSubjects`, `demoVideoLessons`, `demoVideoProgress`, `demoCaseNotes`, `demoSponsorSupports`, `demoReferrals`, or `demoDocumentReminders`. Compatibility constants remain only in helper modules for older tests/fixtures and are guarded by source tests from production-page use.

## Intentional limitations

- No archive fields exist for classes, lessons, subjects, assignments, or exams; destructive operations are delete or safe-delete-if-unused depending on dependencies.
- Binary object storage for library uploads, lesson files, and assignment submission files remains pending; database CRUD is completed where schema supports it.
- Exam marks are managed inline on the exams page instead of a dedicated `/dashboard/exams/[examId]` detail route.
- Support create/update mutation forms were not expanded beyond the existing Prisma-backed read/redaction surface.

## School Branding Production Integration — May 11, 2026

Status: implemented end-to-end for tenant runtime pages.

- Branding settings now load the authenticated user with `getRequiredCurrentUser()` and DB-backed school branding with `getSchoolBrandingForUser()`.
- SCHOOL_ADMIN users can edit only their assigned school; TEACHER, STUDENT, and CASE_MANAGER users see a disabled/read-only permission state and server-side updates are denied.
- SUPER_ADMIN updates require an explicit `schoolId` context to prevent accidental tenant updates.
- Branding form persists identity, domains, theme colors, contact details, location, and timezone to Prisma.
- Logo upload is real: PNG, JPG/JPEG, WebP, and safe SVG files are content-validated, size-limited, stored locally for development, and saved to `School.logoUrl`.
- Logo upload, replacement, removal, and branding updates write audit entries without logging raw file data.
- Sidebar and login branding now render saved school logos and names instead of generic-only identity.
