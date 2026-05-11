# Connection Status

| Module | Current status | Evidence | Fix required |
|---|---|---|---|
| Authentication/session | Connected | Login action reads `User`; `getRequiredCurrentUser()` refreshes user, classes, and student link from Prisma. | Replace unsigned cookie with NextAuth/JWT before production. |
| School branding | Connected | Dashboard layout/sidebar/login/dashboard read active `School` data through Prisma branding helpers. | Migrate legacy super-admin empty-state fallback references. |
| Dashboard stats | Connected | Active student/class counts and attendance summary are DB-backed. | Add richer analytics only if requested. |
| Student records | Connected | List/detail filters and create/edit/soft-delete actions use Prisma and `schoolId`. | Add object storage before enabling real photo upload persistence. |
| Classes | Connected | Class creation and teacher assignment write Prisma `Class` rows. | Add edit/delete UI if existing product requirements demand it. |
| Enrollments | Connected | Enrollment transfer form writes active/transfer enrollment history. | Add bulk enrollment only if requested. |
| Attendance | Connected | Register reads active enrollments, saves attendance upserts, and exports live rows. | Add browser duplicate UX polish if needed. |
| LMS lessons | Connected | Subject/lesson pages use Prisma `Subject`, `Lesson`, `LessonFile`. | Add create/upload actions with storage. |
| Assignments/submissions | Partial | Assignment lists/submission tables read Prisma. | Persist teacher grading inputs with a dedicated action. |
| Exams/marks | Partial | Exams and existing marks read Prisma. | Add create-exam and save-mark server actions. |
| Grades/report cards | Connected | Report cards aggregate Prisma assignment submissions and exam marks. | Improve PDF styling if requested. |
| E-Library | Partial | Library list/detail/download reads Prisma; upload validates files. | Add object storage and DB create action for uploaded files. |
| Video lessons | Partial | Schema supports videos/progress; some UI remains on legacy compatibility paths. | Complete Prisma migration for video list/detail/progress/save actions. |
| Support cases | Partial | Schema supports case notes/support/referrals/reminders; UI still needs helper migration. | Migrate support helpers/actions to Prisma. |
| Tenant isolation tests | Connected | Existing tenant tests still cover core guards; added manual checks. | Add page/action integration tests with a test DB. |
