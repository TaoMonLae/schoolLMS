import { db } from "@/lib/db";
import { mapStudentRecord } from "@/lib/students";
import { tenantFilter } from "@/lib/tenant";
import { AppUser } from "@/lib/types";

export function calculatePercent(points: number, max: number) { return Math.round((points / max) * 100); }
export function getProgressBand(percent: number) { if (percent >= 85) return "GED Ready"; if (percent >= 70) return "On Track"; if (percent >= 50) return "Building Skills"; return "Needs Support"; }

async function visibleClassIds(user: AppUser) {
  if (user.role === "TEACHER") return user.assignedClassIds;
  if (user.role === "STUDENT") {
    const rows = await db.enrollment.findMany({ where: { ...tenantFilter(user), studentId: user.studentId || "__none__", status: "ACTIVE" }, select: { classId: true } });
    return rows.map((r) => r.classId);
  }
  const rows = await db.class.findMany({ where: tenantFilter(user), select: { id: true } });
  return rows.map((r) => r.id);
}

export async function getVisibleClassesForLearning(user: AppUser) {
  const ids = await visibleClassIds(user);
  const rows = await db.class.findMany({ where: { ...tenantFilter(user), id: { in: ids } }, orderBy: { name: "asc" } });
  return rows.map((c) => ({ id: c.id, name: c.name, teacherId: c.teacherId || undefined }));
}

export async function getVisibleSubjects(user: AppUser) { return db.subject.findMany({ where: tenantFilter(user), orderBy: { name: "asc" } }); }

export async function getVisibleLessons(user: AppUser, subjectId = "ALL") {
  const ids = await visibleClassIds(user);
  return db.lesson.findMany({ where: { ...tenantFilter(user), classId: { in: ids }, ...(subjectId !== "ALL" ? { subjectId } : {}) }, include: { class: true, subject: true, createdBy: true, files: true }, orderBy: { updatedAt: "desc" } });
}
export async function getLessonForUser(user: AppUser, lessonId: string) { return (await getVisibleLessons(user)).find((l) => l.id === lessonId); }

export async function getVisibleAssignments(user: AppUser, subjectId = "ALL") {
  const ids = await visibleClassIds(user);
  return db.assignment.findMany({ where: { ...tenantFilter(user), classId: { in: ids }, ...(subjectId !== "ALL" ? { subjectId } : {}) }, include: { class: true, subject: true }, orderBy: { dueDate: "asc" } });
}
export async function getAssignmentForUser(user: AppUser, assignmentId: string) { return (await getVisibleAssignments(user)).find((a) => a.id === assignmentId); }

export async function getSubmissionsForAssignment(user: AppUser, assignmentId: string) {
  const assignment = await getAssignmentForUser(user, assignmentId); if (!assignment) return [];
  const students = await db.student.findMany({ where: { ...tenantFilter(user), status: "ACTIVE", deletedAt: null, enrollments: { some: { classId: assignment.classId, status: "ACTIVE" } } }, include: { enrollments: { where: { status: "ACTIVE" }, include: { class: true }, take: 1 } }, orderBy: { studentNumber: "asc" } });
  const submissions = await db.assignmentSubmission.findMany({ where: { ...tenantFilter(user), assignmentId } });
  return students.map((student) => ({ student: mapStudentRecord(student), submission: submissions.find((s) => s.studentId === student.id) }));
}

export async function getVisibleExams(user: AppUser, subjectId = "ALL") {
  const ids = await visibleClassIds(user);
  return db.exam.findMany({ where: { ...tenantFilter(user), classId: { in: ids }, ...(subjectId !== "ALL" ? { subjectId } : {}) }, include: { class: true, subject: true, marks: true }, orderBy: { examDate: "asc" } });
}

export async function getStudentReportCard(user: AppUser, studentId: string) {
  const studentRow = await db.student.findFirst({ where: { ...tenantFilter(user), id: studentId, deletedAt: null }, include: { enrollments: { where: { status: "ACTIVE" }, include: { class: true }, take: 1 } } });
  if (!studentRow) return undefined;
  const student = mapStudentRecord(studentRow);
  const subjects = await getVisibleSubjects(user);
  const rows = await Promise.all(subjects.map(async (subject) => {
    const assignments = await db.assignment.findMany({ where: { ...tenantFilter(user), subjectId: subject.id, classId: student.classId }, include: { submissions: { where: { studentId } } } });
    const assignmentScores = assignments.map((a) => a.submissions[0]?.points === null || a.submissions[0]?.points === undefined ? undefined : calculatePercent(a.submissions[0].points!, a.maxPoints)).filter((v): v is number => typeof v === "number");
    const exams = await db.exam.findMany({ where: { ...tenantFilter(user), subjectId: subject.id, classId: student.classId }, include: { marks: { where: { studentId } } } });
    const examScores = exams.map((e) => e.marks[0] ? calculatePercent(e.marks[0].marks, e.maxMarks) : undefined).filter((v): v is number => typeof v === "number");
    const allScores = [...assignmentScores, ...examScores]; const percent = allScores.length ? Math.round(allScores.reduce((a,b)=>a+b,0)/allScores.length) : 0;
    return { subject, assignmentCount: assignmentScores.length, examCount: examScores.length, percent, band: allScores.length ? getProgressBand(percent) : "Not Started" };
  }));
  const scoredRows = rows.filter((r) => r.percent > 0); const overall = scoredRows.length ? Math.round(scoredRows.reduce((s,r)=>s+r.percent,0)/scoredRows.length) : 0;
  return { student, rows, overall, band: overall ? getProgressBand(overall) : "Not Started", parentSummary: `${student.preferredName || student.legalName} is ${overall ? getProgressBand(overall).toLowerCase() : "starting"} across GED-style learning goals.` };
}
export async function getDefaultReportStudentId(user: AppUser) { const row = await db.student.findFirst({ where: { ...tenantFilter(user), status: "ACTIVE", deletedAt: null }, orderBy: { studentNumber: "asc" } }); return row?.id; }
export async function getSubjectName(subjectId: string) { return (await db.subject.findUnique({ where: { id: subjectId } }))?.name || "Unknown subject"; }
