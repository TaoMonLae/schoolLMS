# Connection Status

| Module | Status | Real DB-backed? | Real auth-backed? | CRUD complete? | Remaining issue |
|---|---|---:|---:|---:|---|
| Authentication / Logout | Connected | Yes | Yes | N/A | Session cookie is still the existing lightweight cookie implementation. |
| Super Admin | Connected | Yes | Yes | School/admin flows connected | None known for logout; protected route remains server-guarded. |
| Users & Access | Connected | Yes | Yes | Yes | Password resets set temporary passwords; no email delivery integration. |
| Branding | Connected | Yes | Yes | Yes | Local dev logo storage is implemented; production object storage adapter can be swapped in later. |
| Classes | Connected | Yes | Yes | Yes | No archive column exists in schema; safe delete blocks deletion when dependent records exist. |
| LMS Subjects | Connected | Yes | Yes | Yes | Subject delete is safe-delete-only when unused. |
| LMS Lessons | Connected | Yes | Yes | Yes | Binary lesson-file upload storage is intentionally pending; lesson/file metadata reads remain DB-backed. |
| Assignments | Connected | Yes | Yes | Yes | Student file submission upload storage is not implemented. |
| Exams | Connected | Yes | Yes | Yes | Marks save inline on the exams list rather than a separate detail page. |
| Video Lessons | Connected | Yes | Yes | Create/read/progress complete | External video hosting/storage is URL-based. |
| Refugee Support | Connected | Yes | Yes | Read/sensitive visibility complete | Support create/update forms are not expanded in this pass. |
| Library | Connected | Yes | Yes | Upload/read/download partial | Upload currently validates file inputs; object storage persistence remains pending. |
| Attendance | Connected | Yes | Yes | Yes | Export routes depend on runtime DB access. |
| Enrollments | Connected | Yes | Yes | Partial | Enrollment list/action coverage exists, but roster UX can be expanded further. |
| Grades / Reports | Connected | Yes | Yes | Read/report complete | Depends on assignment and exam marks. |

## Branding Connection Status — May 11, 2026

**Branding: Connected**

Branding is marked Connected because it is now:
- real auth-backed via `getRequiredCurrentUser()`;
- real DB-backed via `getSchoolBrandingForUser()` and Prisma `School` updates;
- persistent for all implemented branding fields after save and refresh;
- persistent for logo upload, replacement, and removal through `School.logoUrl`;
- previewed from saved/current form data with the actual logo and colors;
- applied across dashboard layout/sidebar, login page school identity, and existing PDF report/export headers that use school names.

Local development logo storage uses `public/uploads/schools/<schoolId>/`. Production can switch to R2, S3, or DigitalOcean Spaces by replacing the storage adapter factory in `lib/school-logo-storage.ts` while keeping the same `put()` contract.
