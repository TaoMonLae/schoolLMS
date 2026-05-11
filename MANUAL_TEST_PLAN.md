# Manual Test Plan

## Authentication
- Super admin login/logout.
- School admin login/logout.
- Protected route blocked after logout.

## Users
- School admin create teacher.
- Assign teacher to class.
- Create approved case manager.
- Create student user and link to student record.
- Reset password.
- Deactivate/reactivate user.
- Teacher cannot access Users & Access.

## Branding
- School admin edits branding.
- Save persists after refresh.
- Unauthorized role blocked.

## Classes
- School admin create/edit/delete-if-unused class.
- Assign teacher.
- Teacher sees assigned classes only.
- Open class detail and Manage roster link.

## LMS
- Create subject.
- Edit subject.
- Delete unused subject.
- Create lesson.
- Edit lesson.
- Delete lesson.
- Lesson visible to correct class.

## Assignments
- Create assignment.
- Edit/publish/close assignment.
- Student sees only own-class assignment.
- Teacher grades submission and refresh shows saved grade.

## Exams
- Create exam.
- Enter and save marks.
- Edit exam.
- Report/grade views reflect saved marks.

## Video Lessons
- School admin sees all own-school classes.
- Teacher sees assigned classes only.
- Create video saves.
- Student sees permitted video only.
- Video progress persists.

## Support
- Case dropdown loads real students.
- Sensitive notes visible/redacted correctly.
- Tenant isolation works.

## Library
- No duplicate-key console warning.

## School Branding Manual Browser Tests — May 11, 2026

1. Login as SCHOOL_ADMIN.
2. Open Branding.
3. Change school name, short name, colors, phone, email, website, and address.
4. Save and refresh; all values remain.
5. Upload a PNG logo; save; confirm logo appears in preview.
6. Refresh; logo still appears.
7. Visit dashboard; sidebar shows the uploaded logo.
8. Visit login page; branding reflects the saved school identity where applicable.
9. Replace the logo with another file; confirm it changes.
10. Remove the logo; confirm fallback appears.
11. Login as TEACHER; branding route is blocked or read-only.
12. Attempt cross-school update; verify it is denied.
