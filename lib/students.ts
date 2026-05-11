import { filterToTenant } from "@/lib/tenant";
import { AppUser, Gender, SchoolClassOption, StudentRecord, StudentStatus } from "@/lib/types";

export const demoClasses: SchoolClassOption[] = [
  { id: "class-primary-a", name: "Primary A", teacherId: "user-teacher-lead" },
  { id: "class-bridge-english", name: "Bridge English", teacherId: "user-teacher-lead" },
  { id: "class-math-2", name: "Math Level 2", teacherId: "user-teacher-math" }
];

export const demoCurrentUser: AppUser = {
  id: "user-school-admin",
  schoolId: "seed-school-mon-rlc",
  role: "SCHOOL_ADMIN",
  assignedClassIds: []
};

export const demoStudents: StudentRecord[] = [
  {
    id: "student-aye-chan",
    schoolId: "seed-school-mon-rlc",
    studentNumber: "MON-001",
    legalName: "Aye Chan",
    preferredName: "Aye",
    gender: "FEMALE",
    status: "ACTIVE",
    dateOfBirth: "2014-04-10",
    primaryLanguage: "Burmese",
    classId: "class-primary-a",
    className: "Primary A",
    guardianName: "Daw Mya",
    guardianRelationship: "Mother",
    guardianPhone: "+60 12 000 0000",
    guardianEmail: "mya.guardian@example.org",
    homeAddress: "Sentul, Kuala Lumpur",
    emergencyContactName: "Ko Lin",
    emergencyContactPhone: "+60 13 000 0000",
    emergencyRelationship: "Uncle",
    unhcrStatus: "Registered",
    documentType: "UNHCR_CARD",
    documentNumber: "UNHCR-2026-001",
    documentExpiryDate: "2027-12-31"
  },
  {
    id: "student-min-thu",
    schoolId: "seed-school-mon-rlc",
    studentNumber: "MON-002",
    legalName: "Min Thu",
    preferredName: "Min",
    gender: "MALE",
    status: "ACTIVE",
    dateOfBirth: "2013-09-18",
    primaryLanguage: "Mon",
    classId: "class-primary-a",
    className: "Primary A",
    guardianName: "Nai Soe",
    guardianRelationship: "Father",
    guardianPhone: "+60 12 222 0000",
    homeAddress: "Gombak, Kuala Lumpur",
    emergencyContactName: "Mi Hnin",
    emergencyContactPhone: "+60 16 222 0000",
    emergencyRelationship: "Aunt",
    unhcrStatus: "Pending renewal",
    documentType: "ASYLUM_SEEKER_CERTIFICATE",
    documentNumber: "ASC-88219",
    documentExpiryDate: "2026-10-15"
  },
  {
    id: "student-nilar-win",
    schoolId: "seed-school-mon-rlc",
    studentNumber: "MON-003",
    legalName: "Nilar Win",
    preferredName: "Nilar",
    gender: "FEMALE",
    status: "ACTIVE",
    dateOfBirth: "2012-02-03",
    primaryLanguage: "Burmese",
    classId: "class-bridge-english",
    className: "Bridge English",
    guardianName: "Daw Khin",
    guardianRelationship: "Grandmother",
    guardianPhone: "+60 11 333 0000",
    emergencyContactName: "Ko Win",
    emergencyContactPhone: "+60 17 333 0000",
    emergencyRelationship: "Neighbour",
    unhcrStatus: "Registered",
    documentType: "UNHCR_CARD",
    documentNumber: "UNHCR-2026-003",
    documentExpiryDate: "2028-01-20"
  },
  {
    id: "student-htun-lin",
    schoolId: "seed-school-mon-rlc",
    studentNumber: "MON-004",
    legalName: "Htun Lin",
    preferredName: "Htun",
    gender: "MALE",
    status: "TRANSFERRED",
    dateOfBirth: "2011-11-25",
    primaryLanguage: "Mon",
    classId: "class-bridge-english",
    className: "Bridge English",
    guardianName: "Nai Tun",
    guardianRelationship: "Father",
    guardianPhone: "+60 12 444 0000",
    emergencyContactName: "Daw May",
    emergencyContactPhone: "+60 18 444 0000",
    emergencyRelationship: "Family friend"
  },
  {
    id: "student-sandi-oo",
    schoolId: "seed-school-mon-rlc",
    studentNumber: "MON-005",
    legalName: "Sandi Oo",
    preferredName: "Sandi",
    gender: "FEMALE",
    status: "ACTIVE",
    dateOfBirth: "2015-06-01",
    primaryLanguage: "Burmese",
    classId: "class-math-2",
    className: "Math Level 2",
    guardianName: "Daw Ei",
    guardianRelationship: "Mother",
    guardianPhone: "+60 19 555 0000",
    emergencyContactName: "Ko Zaw",
    emergencyContactPhone: "+60 12 555 0000",
    emergencyRelationship: "Cousin",
    unhcrStatus: "Not recorded",
    documentType: "COMMUNITY_LETTER",
    documentNumber: "MLC-4421"
  }
];

export type StudentFilters = {
  search?: string;
  classId?: string;
  gender?: Gender | "ALL";
  status?: StudentStatus | "ALL";
};

export function getVisibleStudentsForUser(user: AppUser, filters: StudentFilters = {}) {
  const search = filters.search?.trim().toLowerCase();

  // filterToTenant is a safety-net second layer — even if the schoolId filter below
  // were accidentally removed, no cross-school records would leak.
  return filterToTenant(
    user,
    demoStudents
      .filter((student) => !student.deletedAt)
      .filter((student) => user.role === "SUPER_ADMIN" || student.schoolId === user.schoolId)
    .filter((student) => user.role !== "TEACHER" || user.assignedClassIds.includes(student.classId))
    .filter((student) => !filters.classId || filters.classId === "ALL" || student.classId === filters.classId)
    .filter((student) => !filters.gender || filters.gender === "ALL" || student.gender === filters.gender)
    .filter((student) => !filters.status || filters.status === "ALL" || student.status === filters.status)
    .filter((student) => {
      if (!search) {
        return true;
      }

      return [student.legalName, student.preferredName, student.studentNumber, student.guardianName, student.className]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(search));
    })
  );
}

export function getStudentForUser(user: AppUser, studentId: string) {
  return getVisibleStudentsForUser(user).find((student) => student.id === studentId);
}

export function formatEnumLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function getStudentInitials(student: Pick<StudentRecord, "legalName" | "preferredName">) {
  const source = student.preferredName || student.legalName;
  return source
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
