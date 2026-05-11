# Connection Status

Audit date: 2026-05-11

| Module | Status | Real DB-backed? | Real auth-backed? | Remaining issue |
|---|---|---:|---:|---|
| Authentication/session | Connected | Yes | Yes | Cookie session remains a lightweight custom implementation; production should migrate to a signed/JWT session strategy. |
| Super Admin shell | Connected | Yes | Yes | Build currently depends on Google Font fetch availability. |
| School branding | Connected | Yes | Yes | File/logo upload storage remains a future enhancement; text/color/contact fields persist. |
| Video lessons | Connected | Yes | Yes | Requires subjects/classes to exist before uploads; private video storage itself is external URL-based. |
| Case support | Connected | Yes | Yes | Add-record UI is presentational; read paths, dropdowns, redaction, and audit preview are DB-backed. |
| Library | Connected | Yes | Yes | No duplicate badge key risk remains in book badges. |
| Students/classes/enrollments/attendance | Connected | Yes | Yes | No known tenant-isolation issue found in this pass. |
| LMS/assignments/exams/grades reads | Connected | Yes | Yes | Some advanced CRUD/reporting flows remain outside this bug-fix scope. |
| Users & Access | Connected | Yes | Yes | School-scoped CRUD, password reset, class assignment, student linking, active status, and audit records added. |
| Legacy demo fixtures | Demo only | No | No | Intentionally retained only as compatibility/test fixtures in `lib/students.ts`, `lib/branding.ts`, and empty support demo exports; production pages audited not to import them. |
