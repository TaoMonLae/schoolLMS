import { canManageSupport } from "@/lib/rbac";
import { demoStudents } from "@/lib/students";
import { filterToTenant } from "@/lib/tenant";
import { AppUser, CaseNoteSensitivity, ReferralStatus, SponsorSupportStatus, StudentRecord, TenantScoped } from "@/lib/types";

export type CaseNote = TenantScoped & {
  id: string;
  studentId: string;
  authorName: string;
  title: string;
  note: string;
  sensitivity: CaseNoteSensitivity;
  createdAt: string;
};

export type VisibleCaseNote = Omit<CaseNote, "note"> & {
  note?: string;
  redacted: boolean;
};

export type SponsorSupport = TenantScoped & {
  id: string;
  studentId: string;
  sponsorName: string;
  supportType: string;
  amount?: number;
  currency?: string;
  status: SponsorSupportStatus;
  startDate?: string;
  endDate?: string;
  notes?: string;
};

export type Referral = TenantScoped & {
  id: string;
  studentId: string;
  agency: string;
  reason: string;
  status: ReferralStatus;
  referredAt: string;
  resolvedAt?: string;
  notes?: string;
};

export type DocumentExpiryReminder = TenantScoped & {
  id: string;
  studentId: string;
  documentType: string;
  documentRef?: string;
  expiryDate: string;
  reminderDate: string;
  resolved: boolean;
};

export type SensitiveAuditEvent = {
  schoolId: string;
  studentId?: string;
  actorId: string;
  action: "VIEW" | "CREATE" | "UPDATE" | "DELETE";
  resourceType: string;
  resourceId: string;
  metadata: Record<string, string | boolean | undefined>;
};

export const demoCaseNotes: CaseNote[] = [
  {
    id: "case-basic-aye",
    schoolId: "seed-school-mon-rlc",
    studentId: "student-aye-chan",
    authorName: "Lead Teacher",
    title: "Classroom adjustment",
    note: "Aye responds well to visual instructions and peer reading support.",
    sensitivity: "BASIC",
    createdAt: "2026-05-09"
  },
  {
    id: "case-sensitive-aye-family",
    schoolId: "seed-school-mon-rlc",
    studentId: "student-aye-chan",
    authorName: "Case Manager",
    title: "Family situation",
    note: "Sensitive family situation details are stored here and must never appear in unauthorized views or logs.",
    sensitivity: "SENSITIVE",
    createdAt: "2026-05-10"
  },
  {
    id: "case-basic-min",
    schoolId: "seed-school-mon-rlc",
    studentId: "student-min-thu",
    authorName: "Lead Teacher",
    title: "Attendance follow-up",
    note: "Guardian prefers phone contact after 5pm.",
    sensitivity: "BASIC",
    createdAt: "2026-05-08"
  }
];

export const demoSponsorSupports: SponsorSupport[] = [
  {
    id: "support-aye-transport",
    schoolId: "seed-school-mon-rlc",
    studentId: "student-aye-chan",
    sponsorName: "Community Education Fund",
    supportType: "Transport stipend",
    amount: 80,
    currency: "MYR",
    status: "ACTIVE",
    startDate: "2026-04-01",
    notes: "Monthly support for travel to school."
  }
];

export const demoReferrals: Referral[] = [
  {
    id: "referral-aye-health",
    schoolId: "seed-school-mon-rlc",
    studentId: "student-aye-chan",
    agency: "Community Health Partner",
    reason: "Vision screening",
    status: "IN_PROGRESS",
    referredAt: "2026-05-06",
    notes: "Appointment requested for next clinic day."
  }
];

export const demoDocumentReminders: DocumentExpiryReminder[] = [
  {
    id: "reminder-min-asc",
    schoolId: "seed-school-mon-rlc",
    studentId: "student-min-thu",
    documentType: "Asylum seeker certificate",
    documentRef: "ASC-88219",
    expiryDate: "2026-10-15",
    reminderDate: "2026-09-15",
    resolved: false
  },
  {
    id: "reminder-aye-unhcr",
    schoolId: "seed-school-mon-rlc",
    studentId: "student-aye-chan",
    documentType: "UNHCR card",
    documentRef: "UNHCR-2026-001",
    expiryDate: "2027-12-31",
    reminderDate: "2027-11-30",
    resolved: false
  }
];

export function canViewSensitiveSupport(user: AppUser) {
  return user.role === "SUPER_ADMIN" || user.role === "SCHOOL_ADMIN" || (user.role === "CASE_MANAGER" && user.approvedForSensitiveCaseNotes === true);
}

export function canAddSensitiveSupport(user: AppUser) {
  return canViewSensitiveSupport(user) && canManageSupport(user.role);
}

export function canAddBasicSupport(user: AppUser, student: StudentRecord) {
  if (user.role === "SUPER_ADMIN" || user.role === "SCHOOL_ADMIN" || user.role === "CASE_MANAGER") {
    return user.role === "SUPER_ADMIN" || user.schoolId === student.schoolId;
  }

  if (user.role === "TEACHER") {
    return user.schoolId === student.schoolId && user.assignedClassIds.includes(student.classId);
  }

  return false;
}

export function getSupportStudentsForUser(user: AppUser) {
  return filterToTenant(
    user,
    demoStudents.filter((student) => {
      if (student.deletedAt) return false;
      if (user.role === "SUPER_ADMIN") return true;
      if (user.role === "TEACHER") return student.schoolId === user.schoolId && user.assignedClassIds.includes(student.classId);
      return student.schoolId === user.schoolId;
    })
  );
}

export function getSupportStudentForUser(user: AppUser, studentId: string) {
  return getSupportStudentsForUser(user).find((student) => student.id === studentId);
}

export function getVisibleCaseNotesForStudent(user: AppUser, studentId: string) {
  const student = getSupportStudentForUser(user, studentId);
  if (!student) return [];
  const canSeeSensitive = canViewSensitiveSupport(user);

  // filterToTenant is a safety net — notes are additionally filtered by schoolId below
  return filterToTenant(
    user,
    demoCaseNotes
      .filter((note) => note.schoolId === student.schoolId && note.studentId === student.id)
    .map((note): VisibleCaseNote => {
      if (note.sensitivity === "SENSITIVE" && !canSeeSensitive) {
        const { note: _privateNote, ...safeNote } = note;
        void _privateNote;
        return { ...safeNote, redacted: true };
      }

      return { ...note, redacted: false };
    })
  );
}

export function getSensitiveAuditEvent(user: AppUser, note: CaseNote, action: SensitiveAuditEvent["action"]): SensitiveAuditEvent {
  return {
    schoolId: note.schoolId,
    studentId: note.studentId,
    actorId: user.id,
    action,
    resourceType: "case_note",
    resourceId: note.id,
    metadata: {
      sensitivity: note.sensitivity,
      contentLogged: false
    }
  };
}

export function getSensitiveAuditPreview(user: AppUser, studentId: string) {
  return demoCaseNotes
    .filter((note) => note.studentId === studentId && note.sensitivity === "SENSITIVE")
    .map((note) => getSensitiveAuditEvent(user, note, "VIEW"));
}

export function getSponsorSupportsForStudent(user: AppUser, studentId: string) {
  const student = getSupportStudentForUser(user, studentId);
  if (!student) return [];
  return filterToTenant(
    user,
    demoSponsorSupports.filter((support) => support.schoolId === student.schoolId && support.studentId === student.id)
  );
}

export function getReferralsForStudent(user: AppUser, studentId: string) {
  const student = getSupportStudentForUser(user, studentId);
  if (!student) return [];
  return filterToTenant(
    user,
    demoReferrals.filter((referral) => referral.schoolId === student.schoolId && referral.studentId === student.id)
  );
}

export function getDocumentRemindersForUser(user: AppUser) {
  const visibleStudentIds = new Set(getSupportStudentsForUser(user).map((student) => student.id));
  return filterToTenant(
    user,
    demoDocumentReminders.filter((reminder) => {
      return visibleStudentIds.has(reminder.studentId) && (user.role === "SUPER_ADMIN" || reminder.schoolId === user.schoolId);
    })
  );
}
