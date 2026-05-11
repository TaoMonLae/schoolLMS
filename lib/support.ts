import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { canManageSupport } from "@/lib/rbac";
import { tenantFilter } from "@/lib/tenant";
import { AppUser, CaseNoteSensitivity, ReferralStatus, SponsorSupportStatus, StudentRecord, TenantScoped } from "@/lib/types";
import { mapStudentRecord } from "@/lib/students";

export type CaseNote = TenantScoped & { id: string; studentId: string; authorName: string; title: string; note: string; sensitivity: CaseNoteSensitivity; createdAt: string };
export type VisibleCaseNote = Omit<CaseNote, "note"> & { note?: string; redacted: boolean };
export type SponsorSupport = TenantScoped & { id: string; studentId: string; sponsorName: string; supportType: string; amount?: number; currency?: string; status: SponsorSupportStatus; startDate?: string; endDate?: string; notes?: string };
export type Referral = TenantScoped & { id: string; studentId: string; agency: string; reason: string; status: ReferralStatus; referredAt: string; resolvedAt?: string; notes?: string };
export type DocumentExpiryReminder = TenantScoped & { id: string; studentId: string; documentType: string; documentRef?: string; expiryDate: string; reminderDate: string; resolved: boolean };
export type SensitiveAuditEvent = { schoolId: string; studentId?: string; actorId: string; action: "VIEW" | "CREATE" | "UPDATE" | "DELETE"; resourceType: string; resourceId: string; metadata: Record<string, string | boolean | undefined> };

const activeEnrollmentInclude = { enrollments: { where: { status: "ACTIVE" as const }, include: { class: true }, orderBy: { startDate: "desc" as const }, take: 1 } };

type StudentWithClass = Prisma.StudentGetPayload<{ include: typeof activeEnrollmentInclude }>;

function dateValue(value?: Date | null) { return value ? value.toISOString().slice(0, 10) : undefined; }

function supportStudentWhere(user: AppUser): Prisma.StudentWhereInput {
  const where: Prisma.StudentWhereInput = { ...tenantFilter(user), deletedAt: null };
  if (user.role === "STUDENT") where.id = user.studentId || "__none__";
  if (user.role === "TEACHER") where.enrollments = { some: { status: "ACTIVE", classId: { in: user.assignedClassIds } } };
  return where;
}

export function canViewSensitiveSupport(user: AppUser) {
  return user.role === "SUPER_ADMIN" || user.role === "SCHOOL_ADMIN" || (user.role === "CASE_MANAGER" && user.approvedForSensitiveCaseNotes === true);
}

export function canAddSensitiveSupport(user: AppUser) { return canViewSensitiveSupport(user) && canManageSupport(user.role); }

export function canAddBasicSupport(user: AppUser, student: StudentRecord) {
  if (user.role === "SUPER_ADMIN") return true;
  if (user.role === "SCHOOL_ADMIN" || user.role === "CASE_MANAGER") return user.schoolId === student.schoolId;
  if (user.role === "TEACHER") return user.schoolId === student.schoolId && user.assignedClassIds.includes(student.classId);
  return false;
}

export async function getSupportStudentsForUser(user: AppUser): Promise<StudentRecord[]> {
  const students = await db.student.findMany({
    where: supportStudentWhere(user),
    include: activeEnrollmentInclude,
    orderBy: [{ studentNumber: "asc" }, { legalName: "asc" }]
  });
  return students.map((student: StudentWithClass) => mapStudentRecord(student));
}

export async function getSupportStudentForUser(user: AppUser, studentId: string) {
  const student = await db.student.findFirst({ where: { ...supportStudentWhere(user), id: studentId }, include: activeEnrollmentInclude });
  return student ? mapStudentRecord(student) : null;
}

function mapCaseNote(note: Prisma.CaseNoteGetPayload<{ include: { author: { select: { name: true } } } }>): CaseNote {
  return { id: note.id, schoolId: note.schoolId, studentId: note.studentId, authorName: note.author?.name || "School staff", title: note.title, note: note.note, sensitivity: note.sensitivity, createdAt: dateValue(note.createdAt) || "" };
}

export function getSensitiveAuditEvent(user: AppUser, note: CaseNote, action: SensitiveAuditEvent["action"]): SensitiveAuditEvent {
  return { schoolId: note.schoolId, studentId: note.studentId, actorId: user.id, action, resourceType: "case_note", resourceId: note.id, metadata: { sensitivity: note.sensitivity, contentLogged: false } };
}

export async function getVisibleCaseNotesForStudent(user: AppUser, studentId: string): Promise<VisibleCaseNote[]> {
  const student = await getSupportStudentForUser(user, studentId);
  if (!student) return [];
  const canSeeSensitive = canViewSensitiveSupport(user);
  const notes = await db.caseNote.findMany({ where: { schoolId: student.schoolId, studentId: student.id }, include: { author: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
  if (canSeeSensitive) {
    const sensitiveNoteIds = notes.filter((note) => note.sensitivity === "SENSITIVE").map((note) => note.id);
    if (sensitiveNoteIds.length > 0) {
      await db.sensitiveAuditLog.createMany({ data: sensitiveNoteIds.map((resourceId) => ({ schoolId: student.schoolId, studentId: student.id, actorId: user.id, action: "VIEW", resourceType: "case_note", resourceId, metadata: { contentLogged: false } })) });
    }
  }
  return notes.map(mapCaseNote).map((note) => {
    if (note.sensitivity === "SENSITIVE" && !canSeeSensitive) {
      const { note: _privateNote, ...safeNote } = note;
      void _privateNote;
      return { ...safeNote, redacted: true };
    }
    return { ...note, redacted: false };
  });
}

export async function getSensitiveAuditPreview(user: AppUser, studentId: string): Promise<SensitiveAuditEvent[]> {
  const student = await getSupportStudentForUser(user, studentId);
  if (!student) return [];
  const logs = await db.sensitiveAuditLog.findMany({ where: { schoolId: student.schoolId, studentId, resourceType: "case_note" }, orderBy: { createdAt: "desc" }, take: 5 });
  if (logs.length > 0) {
    return logs.map((log) => ({ schoolId: log.schoolId, studentId: log.studentId || undefined, actorId: log.actorId || user.id, action: log.action as SensitiveAuditEvent["action"], resourceType: log.resourceType, resourceId: log.resourceId, metadata: { contentLogged: false } }));
  }
  const sensitiveNotes = await db.caseNote.findMany({ where: { schoolId: student.schoolId, studentId, sensitivity: "SENSITIVE" }, include: { author: { select: { name: true } } }, take: 5 });
  return sensitiveNotes.map((note) => getSensitiveAuditEvent(user, mapCaseNote(note), "VIEW"));
}

export async function getSponsorSupportsForStudent(user: AppUser, studentId: string): Promise<SponsorSupport[]> {
  const student = await getSupportStudentForUser(user, studentId);
  if (!student) return [];
  const rows = await db.sponsorSupport.findMany({ where: { schoolId: student.schoolId, studentId: student.id }, orderBy: { createdAt: "desc" } });
  return rows.map((row) => ({ id: row.id, schoolId: row.schoolId, studentId: row.studentId, sponsorName: row.sponsorName, supportType: row.supportType, amount: row.amount ? Number(row.amount) : undefined, currency: row.currency || undefined, status: row.status, startDate: dateValue(row.startDate), endDate: dateValue(row.endDate), notes: row.notes || undefined }));
}

export async function getReferralsForStudent(user: AppUser, studentId: string): Promise<Referral[]> {
  const student = await getSupportStudentForUser(user, studentId);
  if (!student) return [];
  const rows = await db.referral.findMany({ where: { schoolId: student.schoolId, studentId: student.id }, orderBy: { referredAt: "desc" } });
  return rows.map((row) => ({ id: row.id, schoolId: row.schoolId, studentId: row.studentId, agency: row.agency, reason: row.reason, status: row.status, referredAt: dateValue(row.referredAt) || "", resolvedAt: dateValue(row.resolvedAt), notes: row.notes || undefined }));
}

export async function getDocumentRemindersForUser(user: AppUser): Promise<DocumentExpiryReminder[]> {
  const visibleStudents = await getSupportStudentsForUser(user);
  const ids = visibleStudents.map((student) => student.id);
  if (ids.length === 0) return [];
  const rows = await db.documentExpiryReminder.findMany({ where: { ...tenantFilter(user), studentId: { in: ids } }, orderBy: { reminderDate: "asc" } });
  return rows.map((row) => ({ id: row.id, schoolId: row.schoolId, studentId: row.studentId, documentType: row.documentType, documentRef: row.documentRef || undefined, expiryDate: dateValue(row.expiryDate) || "", reminderDate: dateValue(row.reminderDate) || "", resolved: row.resolved }));
}

export const demoCaseNotes: CaseNote[] = [];
export const demoSponsorSupports: SponsorSupport[] = [];
export const demoReferrals: Referral[] = [];
export const demoDocumentReminders: DocumentExpiryReminder[] = [];
