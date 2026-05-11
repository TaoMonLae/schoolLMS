# Connection Status

| Module | Status | Real DB-backed? | Real auth-backed? | CRUD complete? | Remaining issue |
|---|---|---:|---:|---:|---|
| Authentication / Logout | Connected | Yes | Yes | N/A | Session cookie is still the existing lightweight cookie implementation. |
| Super Admin | Connected | Yes | Yes | School/admin flows connected | None known for logout; protected route remains server-guarded. |
| Users & Access | Connected | Yes | Yes | Yes | Password resets set temporary passwords; no email delivery integration. |
| Branding | Connected | Yes | Yes | Yes | Logo upload/object storage is separate from the branding fields completed here. |
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
