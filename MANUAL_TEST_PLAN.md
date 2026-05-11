# Manual Test Plan

## Authentication and tenant shell
1. Seed the database and sign in as a school admin.
2. Confirm `/dashboard` shows the school's real name, colors, active student count, active class count, and today's attendance summary.
3. Confirm the sidebar role navigation matches the signed-in user role.
4. Log in, click **Log out** in the sidebar, confirm redirect to `/login`, then confirm `/dashboard` is no longer accessible without a new login.

## Student records
1. Open `/dashboard/students` and verify students match DB records only for the signed-in school.
2. Filter by class, gender, status, and search text.
3. Create a student, assign a class, and confirm the detail page shows the new record.
4. Edit the student and change class; confirm a new active enrollment exists and the old enrollment is transferred.
5. Soft-delete the student and verify the list hides the record.
6. Confirm student photo upload displays the explicit not-implemented storage note and does not claim persistence.

## Classes and enrollments
1. Open `/dashboard/classes`, create a class, assign a teacher, and confirm it appears in the table.
2. Open `/dashboard/enrollments`, enroll/transfer a student to a different class, and confirm attendance/student filters use the new active enrollment.

## Attendance
1. Open `/dashboard/attendance`, select a class/date, and verify enrolled active students appear.
2. Save statuses/notes and reload the same date to confirm values persist.
3. Save again for the same date and confirm rows update rather than duplicate.
4. Export PDF and Excel and verify they contain live attendance rows.

## LMS, grades, exams
1. Open `/dashboard/lms` and confirm subjects/lessons come from DB.
2. Open `/dashboard/assignments` and an assignment detail page; confirm enrolled students and submissions are loaded.
3. Open `/dashboard/exams`; confirm DB exams and marks appear.
4. Open `/dashboard/grades`; confirm report-card calculations reflect DB assignment submissions and exam marks.
5. Export a report-card PDF.

## Library
1. Open `/dashboard/library`; confirm DB books and filters work.
2. Open a book detail and download it.
3. Try upload validation and confirm object storage is reported as not implemented.

## Tenant isolation
1. Create a second school with students/classes/books.
2. Sign in as school A and attempt direct URLs for school B student/book/class IDs; confirm 404/not visible.
3. Sign in as a teacher and confirm only assigned-class students/attendance/LMS items appear.
4. Sign in as a student and confirm only self-scoped student/attendance/LMS data appears.
