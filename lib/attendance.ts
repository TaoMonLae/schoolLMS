import { filterToTenant } from "@/lib/tenant";
import { demoClasses, demoStudents } from "@/lib/students";
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
  PRESENT: "border-[#b9dfac] bg-[#e8f3dc] text-[#315933]",
  LATE: "border-[#f0d38a] bg-[#fff2d4] text-[#7a5211]",
  ABSENT: "border-[#f2b9af] bg-[#ffe4df] text-[#8b2b20]",
  EXCUSED: "border-[#bfd5f7] bg-[#e7f0ff] text-[#24508f]"
};

export const demoAttendance: AttendanceRecord[] = [
  {
    id: "attendance-aye-2026-05-11",
    schoolId: "seed-school-mon-rlc",
    classId: "class-primary-a",
    studentId: "student-aye-chan",
    date: "2026-05-11",
    status: "PRESENT",
    recordedBy: "user-teacher-lead"
  },
  {
    id: "attendance-min-2026-05-11",
    schoolId: "seed-school-mon-rlc",
    classId: "class-primary-a",
    studentId: "student-min-thu",
    date: "2026-05-11",
    status: "PRESENT",
    recordedBy: "user-teacher-lead"
  },
  {
    id: "attendance-nilar-2026-05-11",
    schoolId: "seed-school-mon-rlc",
    classId: "class-bridge-english",
    studentId: "student-nilar-win",
    date: "2026-05-11",
    status: "PRESENT",
    recordedBy: "user-teacher-lead"
  },
  {
    id: "attendance-htun-2026-05-11",
    schoolId: "seed-school-mon-rlc",
    classId: "class-bridge-english",
    studentId: "student-htun-lin",
    date: "2026-05-11",
    status: "LATE",
    note: "Arrived after morning circle.",
    recordedBy: "user-teacher-lead"
  },
  {
    id: "attendance-aye-2026-05-10",
    schoolId: "seed-school-mon-rlc",
    classId: "class-primary-a",
    studentId: "student-aye-chan",
    date: "2026-05-10",
    status: "ABSENT",
    note: "Guardian notified school in the morning.",
    recordedBy: "user-school-admin"
  },
  {
    id: "attendance-min-2026-05-10",
    schoolId: "seed-school-mon-rlc",
    classId: "class-primary-a",
    studentId: "student-min-thu",
    date: "2026-05-10",
    status: "EXCUSED",
    note: "Clinic appointment.",
    recordedBy: "user-school-admin"
  }
];

export function getAttendanceClassesForUser(user: AppUser) {
  return demoClasses.filter((classItem) => {
    if (user.role === "SUPER_ADMIN") {
      return true;
    }

    if (classItem.id && user.role === "TEACHER") {
      return user.assignedClassIds.includes(classItem.id);
    }

    return true;
  });
}

export function getAttendanceStudentsForUser(user: AppUser, classId: string) {
  return demoStudents
    .filter((student) => !student.deletedAt && student.status === "ACTIVE")
    .filter((student) => user.role === "SUPER_ADMIN" || student.schoolId === user.schoolId)
    .filter((student) => student.classId === classId)
    .filter((student) => user.role !== "STUDENT" || student.id === user.studentId)
    .filter((student) => user.role !== "TEACHER" || user.assignedClassIds.includes(student.classId));
}

export function getAttendanceForClassDate(user: AppUser, classId: string, date: string) {
  const visibleStudentIds = new Set(getAttendanceStudentsForUser(user, classId).map((student) => student.id));

  return filterToTenant(
    user,
    demoAttendance.filter((record) => {
      return record.classId === classId && record.date === date && visibleStudentIds.has(record.studentId);
    })
  );
}

export function getMonthlyAttendanceReport(user: AppUser, classId: string, month: string) {
  const visibleStudentIds = new Set(getAttendanceStudentsForUser(user, classId).map((student) => student.id));

  return filterToTenant(
    user,
    demoAttendance.filter((record) => {
      return record.classId === classId && record.date.startsWith(month) && visibleStudentIds.has(record.studentId);
    })
  );
}

export function getTodayAttendanceSummary(user: AppUser, date = "2026-05-11") {
  const visibleStudents = demoStudents.filter((student) => {
    if (student.deletedAt || student.status !== "ACTIVE") {
      return false;
    }

    if (user.role === "SUPER_ADMIN") {
      return true;
    }

    if (user.role === "TEACHER") {
      return user.assignedClassIds.includes(student.classId);
    }

    if (user.role === "STUDENT") {
      return student.id === user.studentId;
    }

    return student.schoolId === user.schoolId;
  });
  const visibleStudentIds = new Set(visibleStudents.map((student) => student.id));
  const todayRecords = demoAttendance.filter((record) => record.date === date && visibleStudentIds.has(record.studentId));

  return {
    total: visibleStudents.length,
    present: todayRecords.filter((record) => record.status === "PRESENT" || record.status === "LATE").length,
    absent: todayRecords.filter((record) => record.status === "ABSENT").length,
    excused: todayRecords.filter((record) => record.status === "EXCUSED").length
  };
}

export function getExistingAttendanceMap(user: AppUser, classId: string, date: string) {
  return new Map(getAttendanceForClassDate(user, classId, date).map((record) => [record.studentId, record]));
}

export function getAttendanceExportRows(user: AppUser, classId: string, month: string) {
  const studentsById = new Map(demoStudents.map((student) => [student.id, student]));

  return getMonthlyAttendanceReport(user, classId, month).map((record) => {
    const student = studentsById.get(record.studentId);

    return {
      date: record.date,
      studentNumber: student?.studentNumber || "",
      studentName: student?.preferredName || student?.legalName || "",
      className: student?.className || "",
      status: record.status,
      note: record.note || ""
    };
  });
}
