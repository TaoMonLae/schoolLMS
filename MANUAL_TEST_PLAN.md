# Manual Test Plan

Audit date: 2026-05-11

1. Login as `SUPER_ADMIN` → confirm top-bar `Log out` is visible → click → confirm redirect to `/login` → directly open `/super-admin` and verify access is blocked without login.
2. Login as `SCHOOL_ADMIN` → open `/dashboard/settings/branding` → edit name, shortName, domains, colors, phone, email, website, address → save → refresh → verify persisted values.
3. Login as `TEACHER` → confirm Branding and Users & Access are hidden → direct URL `/dashboard/settings/branding` and `/dashboard/users` should be blocked/redirected.
4. Login as `TEACHER` → open `/dashboard/videos/new` → verify only assigned classes appear and subjects are real school subjects.
5. Login as `SCHOOL_ADMIN` → open `/dashboard/videos/new` → verify all own-school classes appear and create a video lesson; refresh `/dashboard/videos` and verify it remains.
6. Attempt direct class/subject IDs from another school in video create form and verify it is rejected.
7. Login as `CASE_MANAGER` → open `/dashboard/support` → verify real visible students populate the dropdown.
8. Login as `TEACHER` → open `/dashboard/support` → verify only students enrolled in assigned classes appear.
9. Login as an unauthorized support viewer → verify sensitive case notes are redacted and content is not rendered.
10. Open library list/detail with subject and language both `English`; verify browser console has no duplicate-key warning.
11. Login as `SCHOOL_ADMIN` → open Users & Access → create a teacher → assign teacher to class → confirm class assignment appears on edit.
12. Create a case manager → mark approved → verify sensitive support visibility changes for that case manager.
13. Create/link a student user account to a same-school student record; try linking to another-school student and verify rejection.
14. Reset a user password → verify the user can log in with the temporary password and the database stores a bcrypt hash, not plaintext.
15. Deactivate/reactivate a user → verify inactive user cannot access protected routes.
16. Login as `TEACHER` → confirm Users & Access nav hidden and direct URL blocked.
