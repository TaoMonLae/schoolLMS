import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { mapStudentRecord } from "@/lib/students";
import { tenantFilter } from "@/lib/tenant";
import { AppUser, AttendanceStatus } from "@/lib/types";

export type AttendanceRecord = {
  id: string;
  schoolId: string;
  classId: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
  recordedBy: string;
};

export const attendanceStatusStyles: Record<AttendanceStatus, string> = {
  PRESENT: "border-success/35 bg-tint-mint text-success",
  LATE: "border-warning/35 bg-tint-yellow text-warning",
  ABSENT: "border-error/35 bg-tint-rose text-error",
  EXCUSED: "border-link/35 bg-tint-sky text-link"
};

function day(date: string) { return new Date(`${date}T00:00:00.000Z`); }
function mapAttendance(record: { id:string; schoolId:string; classId:string; studentId:string; date:Date; status:AttendanceStatus; note:string|null; recordedById:string|null }): AttendanceRecord {
  return { id: record.id, schoolId: record.schoolId, classId: record.classId, studentId: record.studentId, date: record.date.toISOString().slice(0,10), status: record.status, note: record.note || undefined, recordedBy: record.recordedById || "" };
}

export async function getAttendanceClassesForUser(user: AppUser) {
  const classes = await db.class.findMany({ where: { ...tenantFilter(user), ...(user.role === "TEACHER" ? { id: { in: user.assignedClassIds } } : {}) }, orderBy: [{ academicYear: "desc" }, { name: "asc" }] });
  return classes.map((classItem) => ({ id: classItem.id, name: classItem.name, teacherId: classItem.teacherId || undefined }));
}

export async function getAttendanceStudentsForUser(user: AppUser, classId: string) {
  const where: Prisma.StudentWhereInput = {
    ...tenantFilter(user), deletedAt: null, status: "ACTIVE",
    enrollments: { some: { classId, status: "ACTIVE" } },
    ...(user.role === "STUDENT" ? { id: user.studentId || "__none__" } : {}),
    ...(user.role === "TEACHER" ? { enrollments: { some: { classId: { in: user.assignedClassIds.filter((id) => id === classId) }, status: "ACTIVE" } } } : {})
  };
  const students = await db.student.findMany({ where, include: { enrollments: { where: { status: "ACTIVE", classId }, include: { class: true }, take: 1 } }, orderBy: [{ studentNumber: "asc" }] });
  return students.map(mapStudentRecord);
}

export async function getAttendanceForClassDate(user: AppUser, classId: string, date: string) {
  const students = await getAttendanceStudentsForUser(user, classId);
  const studentIds = students.map((student) => student.id);
  const rows = await db.attendance.findMany({ where: { ...tenantFilter(user), classId, date: day(date), studentId: { in: studentIds } } });
  return rows.map(mapAttendance);
}

export async function getMonthlyAttendanceReport(user: AppUser, classId: string, month: string) {
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start); end.setUTCMonth(end.getUTCMonth() + 1);
  const students = await getAttendanceStudentsForUser(user, classId);
  const studentIds = students.map((student) => student.id);
  const rows = await db.attendance.findMany({ where: { ...tenantFilter(user), classId, studentId: { in: studentIds }, date: { gte: start, lt: end } }, orderBy: [{ date: "desc" }] });
  return rows.map(mapAttendance);
}

export async function getTodayAttendanceSummary(user: AppUser, date = new Date().toISOString().slice(0, 10)) {
  const studentWhere: Prisma.StudentWhereInput = { ...tenantFilter(user), deletedAt: null, status: "ACTIVE", ...(user.role === "STUDENT" ? { id: user.studentId || "__none__" } : {}), ...(user.role === "TEACHER" ? { enrollments: { some: { classId: { in: user.assignedClassIds }, status: "ACTIVE" } } } : {}) };
  const students = await db.student.findMany({ where: studentWhere, select: { id: true } });
  const records = await db.attendance.findMany({ where: { ...tenantFilter(user), studentId: { in: students.map((s) => s.id) }, date: day(date) } });
  return { total: students.length, present: records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length, absent: records.filter((r) => r.status === "ABSENT").length, excused: records.filter((r) => r.status === "EXCUSED").length };
}

export async function getExistingAttendanceMap(user: AppUser, classId: string, date: string) {
  return new Map((await getAttendanceForClassDate(user, classId, date)).map((record) => [record.studentId, record]));
}

export async function getAttendanceExportRows(user: AppUser, classId: string, month: string) {
  const report = await getMonthlyAttendanceReport(user, classId, month);
  const studentRows = await db.student.findMany({ where: { ...tenantFilter(user), id: { in: report.map((r) => r.studentId) } }, include: { enrollments: { where: { status: "ACTIVE" }, include: { class: true }, take: 1 } } });
  const studentsById = new Map(studentRows.map((student) => [student.id, mapStudentRecord(student)]));
  return report.map((record) => { const student = studentsById.get(record.studentId); return { date: record.date, studentNumber: student?.studentNumber || "", studentName: student?.preferredName || student?.legalName || "", className: student?.className || "", status: record.status, note: record.note || "" }; });
}
