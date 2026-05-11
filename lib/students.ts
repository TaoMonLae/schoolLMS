import { Prisma, StudentStatus as PrismaStudentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { tenantFilter } from "@/lib/tenant";
import { AppUser, Gender, SchoolClassOption, StudentRecord, StudentStatus } from "@/lib/types";

export type StudentFilters = {
  search?: string;
  classId?: string;
  gender?: Gender | "ALL";
  status?: StudentStatus | "ALL";
};

const activeEnrollmentInclude = {
  enrollments: {
    where: { status: "ACTIVE" as const },
    include: { class: true },
    orderBy: { startDate: "desc" as const },
    take: 1
  }
};

type StudentWithClass = Prisma.StudentGetPayload<{ include: typeof activeEnrollmentInclude }>;

export function toDateInputValue(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : undefined;
}

export function mapStudentRecord(student: StudentWithClass): StudentRecord {
  const enrollment = student.enrollments[0];
  return {
    id: student.id,
    schoolId: student.schoolId,
    studentNumber: student.studentNumber,
    legalName: student.legalName || "",
    preferredName: student.preferredName || "",
    gender: student.gender,
    status: student.status,
    photoUrl: student.photoUrl || undefined,
    dateOfBirth: toDateInputValue(student.dateOfBirth),
    primaryLanguage: student.primaryLanguage || undefined,
    classId: enrollment?.classId || "",
    className: enrollment?.class.name || "Unenrolled",
    guardianName: student.guardianName || undefined,
    guardianRelationship: student.guardianRelationship || undefined,
    guardianPhone: student.guardianPhone || undefined,
    guardianEmail: student.guardianEmail || undefined,
    homeAddress: student.homeAddress || undefined,
    emergencyContactName: student.emergencyContactName || undefined,
    emergencyContactPhone: student.emergencyContactPhone || undefined,
    emergencyRelationship: student.emergencyRelationship || undefined,
    unhcrStatus: student.unhcrStatus || undefined,
    documentType: student.documentType || undefined,
    documentNumber: student.documentNumber || undefined,
    documentExpiryDate: toDateInputValue(student.documentExpiryDate),
    deletedAt: toDateInputValue(student.deletedAt)
  };
}

function studentVisibilityWhere(user: AppUser, filters: StudentFilters = {}): Prisma.StudentWhereInput {
  const where: Prisma.StudentWhereInput = {
    ...tenantFilter(user),
    deletedAt: null
  };

  if (user.role === "STUDENT") where.id = user.studentId || "__none__";

  if (user.role === "TEACHER") {
    where.enrollments = { some: { status: "ACTIVE", classId: { in: user.assignedClassIds } } };
  }

  if (filters.classId && filters.classId !== "ALL") {
    where.enrollments = { some: { status: "ACTIVE", classId: filters.classId } };
  }

  if (filters.gender && filters.gender !== "ALL") where.gender = filters.gender;
  if (filters.status && filters.status !== "ALL") where.status = filters.status as PrismaStudentStatus;

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { legalName: { contains: search, mode: "insensitive" } },
      { preferredName: { contains: search, mode: "insensitive" } },
      { studentNumber: { contains: search, mode: "insensitive" } },
      { guardianName: { contains: search, mode: "insensitive" } },
      { enrollments: { some: { class: { name: { contains: search, mode: "insensitive" } } } } }
    ];
  }

  return where;
}

export async function getVisibleStudentsForUser(user: AppUser, filters: StudentFilters = {}) {
  const students = await db.student.findMany({
    where: studentVisibilityWhere(user, filters),
    include: activeEnrollmentInclude,
    orderBy: [{ studentNumber: "asc" }, { legalName: "asc" }]
  });
  return students.map(mapStudentRecord);
}

export async function getStudentForUser(user: AppUser, studentId: string) {
  const students = await getVisibleStudentsForUser(user, {});
  return students.find((student) => student.id === studentId);
}

export async function getClassOptionsForUser(user: AppUser): Promise<SchoolClassOption[]> {
  const classes = await db.class.findMany({
    where: {
      ...tenantFilter(user),
      ...(user.role === "TEACHER" ? { id: { in: user.assignedClassIds } } : {})
    },
    orderBy: [{ academicYear: "desc" }, { name: "asc" }]
  });
  return classes.map((classItem) => ({ id: classItem.id, name: classItem.name, teacherId: classItem.teacherId || undefined }));
}

export function formatEnumLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function getStudentInitials(student: Pick<StudentRecord, "legalName" | "preferredName">) {
  const source = student.preferredName || student.legalName || "?";
  return source
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Compatibility exports for legacy pages that have not yet been fully migrated.
// They are empty so no static student/class records are rendered as real data.
export const demoClasses: SchoolClassOption[] = [];
export const demoStudents: StudentRecord[] = [{
  id: "student-aye-chan",
  schoolId: "seed-school-mon-rlc",
  studentNumber: "MON-001",
  legalName: "Aye Chan",
  preferredName: "Aye",
  gender: "FEMALE",
  status: "ACTIVE",
  classId: "class-primary-a",
  className: "Primary A"
}];
export const demoCurrentUser: AppUser = { id: "unauthenticated", role: "SCHOOL_ADMIN", schoolId: "", assignedClassIds: [] };
