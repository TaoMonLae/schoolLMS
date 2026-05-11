"use server";
import { CaseNoteSensitivity, ReferralStatus, SponsorSupportStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { canManageSupport } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { canAddBasicSupport, canAddSensitiveSupport, getSupportStudentForUser } from "@/lib/support";

function value(formData: FormData, key: string) { return String(formData.get(key) || "").trim(); }
function optionalDate(input: string) { return input ? new Date(`${input}T00:00:00.000Z`) : null; }
function supportUrl(studentId: string, state: "saved" | "error", message: string) { return `/dashboard/support?studentId=${studentId}&${state}=${encodeURIComponent(message)}`; }
async function requireStudent(studentId: string) {
  const user = await getRequiredCurrentUser();
  const student = await getSupportStudentForUser(user, studentId);
  if (!student) throw new Error("Student not found or not visible");
  return { user, student };
}
async function auditSensitive(userId: string, schoolId: string, studentId: string, action: "VIEW" | "CREATE" | "UPDATE" | "DELETE", resourceId: string) {
  await db.sensitiveAuditLog.create({ data: { schoolId, studentId, actorId: userId, action, resourceType: "case_note", resourceId, metadata: { contentLogged: false } } });
}
async function canManageCaseNote(formData: FormData, sensitivity: CaseNoteSensitivity) {
  const studentId = value(formData, "studentId");
  const { user, student } = await requireStudent(studentId);
  if (sensitivity === "SENSITIVE") {
    if (!canAddSensitiveSupport(user)) throw new Error("Not authorized to manage sensitive case notes");
  } else if (!canAddBasicSupport(user, student)) {
    throw new Error("Not authorized to manage case notes for this student");
  }
  return { user, student };
}
function requireSupportManager(role: string) {
  if (!canManageSupport(role as never)) throw new Error("Not authorized to manage support records");
}

export async function createCaseNote(formData: FormData) {
  const sensitivity = value(formData, "sensitivity") === "SENSITIVE" ? CaseNoteSensitivity.SENSITIVE : CaseNoteSensitivity.BASIC;
  const { user, student } = await canManageCaseNote(formData, sensitivity);
  const note = await db.caseNote.create({ data: { schoolId: student.schoolId, studentId: student.id, authorId: user.id, title: value(formData, "title"), note: value(formData, "note"), sensitivity } });
  if (sensitivity === "SENSITIVE") await auditSensitive(user.id, student.schoolId, student.id, "CREATE", note.id);
  revalidatePath("/dashboard/support");
  redirect(supportUrl(student.id, "saved", "Case note saved"));
}

export async function updateCaseNote(formData: FormData) {
  const noteId = value(formData, "id");
  const studentId = value(formData, "studentId");
  const { user, student } = await requireStudent(studentId);
  const existing = await db.caseNote.findFirst({ where: { id: noteId, schoolId: student.schoolId, studentId: student.id } });
  if (!existing) throw new Error("Case note not found");
  if (existing.sensitivity === "SENSITIVE") {
    if (!canAddSensitiveSupport(user)) throw new Error("Not authorized to manage sensitive case notes");
  } else if (!canAddBasicSupport(user, student)) throw new Error("Not authorized to manage case notes for this student");
  const sensitivity = value(formData, "sensitivity") === "SENSITIVE" ? CaseNoteSensitivity.SENSITIVE : CaseNoteSensitivity.BASIC;
  if (sensitivity === "SENSITIVE" && !canAddSensitiveSupport(user)) throw new Error("Not authorized to make sensitive case notes");
  await db.caseNote.update({ where: { id: noteId }, data: { title: value(formData, "title"), note: value(formData, "note"), sensitivity } });
  if (existing.sensitivity === "SENSITIVE" || sensitivity === "SENSITIVE") await auditSensitive(user.id, student.schoolId, student.id, "UPDATE", noteId);
  revalidatePath("/dashboard/support");
  redirect(supportUrl(student.id, "saved", "Case note updated"));
}

export async function deleteCaseNote(formData: FormData) {
  const studentId = value(formData, "studentId");
  const { user, student } = await requireStudent(studentId);
  const id = value(formData, "id");
  const existing = await db.caseNote.findFirst({ where: { id, schoolId: student.schoolId, studentId: student.id } });
  if (!existing) throw new Error("Case note not found");
  if (existing.sensitivity === "SENSITIVE" && !canAddSensitiveSupport(user)) throw new Error("Not authorized to delete sensitive case notes");
  if (existing.sensitivity === "BASIC" && !canAddBasicSupport(user, student)) throw new Error("Not authorized to delete case notes");
  await db.caseNote.delete({ where: { id } });
  if (existing.sensitivity === "SENSITIVE") await auditSensitive(user.id, student.schoolId, student.id, "DELETE", id);
  revalidatePath("/dashboard/support");
  redirect(supportUrl(student.id, "saved", "Case note deleted"));
}

export async function createSponsorSupport(formData: FormData) {
  const { user, student } = await requireStudent(value(formData, "studentId"));
  requireSupportManager(user.role);
  await db.sponsorSupport.create({ data: { schoolId: student.schoolId, studentId: student.id, recordedById: user.id, sponsorName: value(formData, "sponsorName"), supportType: value(formData, "supportType"), amount: value(formData, "amount") ? Number(value(formData, "amount")) : null, currency: value(formData, "currency") || null, status: (value(formData, "status") || "ACTIVE") as SponsorSupportStatus, startDate: optionalDate(value(formData, "startDate")), endDate: optionalDate(value(formData, "endDate")), notes: value(formData, "notes") || null } });
  revalidatePath("/dashboard/support");
  redirect(supportUrl(student.id, "saved", "Sponsor support saved"));
}
export async function updateSponsorSupport(formData: FormData) {
  const { user, student } = await requireStudent(value(formData, "studentId"));
  requireSupportManager(user.role);
  const id = value(formData, "id");
  await db.sponsorSupport.update({ where: { id, schoolId: student.schoolId, studentId: student.id }, data: { sponsorName: value(formData, "sponsorName"), supportType: value(formData, "supportType"), amount: value(formData, "amount") ? Number(value(formData, "amount")) : null, currency: value(formData, "currency") || null, status: (value(formData, "status") || "ACTIVE") as SponsorSupportStatus, startDate: optionalDate(value(formData, "startDate")), endDate: optionalDate(value(formData, "endDate")), notes: value(formData, "notes") || null } });
  revalidatePath("/dashboard/support");
  redirect(supportUrl(student.id, "saved", "Sponsor support updated"));
}
export async function deleteSponsorSupport(formData: FormData) {
  const { user, student } = await requireStudent(value(formData, "studentId"));
  requireSupportManager(user.role);
  await db.sponsorSupport.delete({ where: { id: value(formData, "id"), schoolId: student.schoolId, studentId: student.id } });
  revalidatePath("/dashboard/support");
  redirect(supportUrl(student.id, "saved", "Sponsor support deleted"));
}

export async function createReferral(formData: FormData) {
  const { user, student } = await requireStudent(value(formData, "studentId"));
  requireSupportManager(user.role);
  await db.referral.create({ data: { schoolId: student.schoolId, studentId: student.id, createdById: user.id, agency: value(formData, "agency"), reason: value(formData, "reason"), status: (value(formData, "status") || "OPEN") as ReferralStatus, referredAt: optionalDate(value(formData, "referredAt")) || new Date(), resolvedAt: optionalDate(value(formData, "resolvedAt")), notes: value(formData, "notes") || null } });
  revalidatePath("/dashboard/support");
  redirect(supportUrl(student.id, "saved", "Referral saved"));
}
export async function updateReferral(formData: FormData) {
  const { user, student } = await requireStudent(value(formData, "studentId"));
  requireSupportManager(user.role);
  const status = (value(formData, "status") || "OPEN") as ReferralStatus;
  await db.referral.update({ where: { id: value(formData, "id"), schoolId: student.schoolId, studentId: student.id }, data: { agency: value(formData, "agency"), reason: value(formData, "reason"), status, referredAt: optionalDate(value(formData, "referredAt")) || new Date(), resolvedAt: status === "RESOLVED" ? (optionalDate(value(formData, "resolvedAt")) || new Date()) : optionalDate(value(formData, "resolvedAt")), notes: value(formData, "notes") || null } });
  revalidatePath("/dashboard/support");
  redirect(supportUrl(student.id, "saved", "Referral updated"));
}

export async function createDocumentReminder(formData: FormData) {
  const { user, student } = await requireStudent(value(formData, "studentId"));
  requireSupportManager(user.role);
  await db.documentExpiryReminder.create({ data: { schoolId: student.schoolId, studentId: student.id, documentType: value(formData, "documentType"), documentRef: value(formData, "documentRef") || null, expiryDate: optionalDate(value(formData, "expiryDate")) || new Date(), reminderDate: optionalDate(value(formData, "reminderDate")) || new Date(), resolved: false } });
  revalidatePath("/dashboard/support");
  redirect(supportUrl(student.id, "saved", "Document reminder saved"));
}
export async function updateDocumentReminder(formData: FormData) {
  const { user, student } = await requireStudent(value(formData, "studentId"));
  requireSupportManager(user.role);
  await db.documentExpiryReminder.update({ where: { id: value(formData, "id"), schoolId: student.schoolId, studentId: student.id }, data: { documentType: value(formData, "documentType"), documentRef: value(formData, "documentRef") || null, expiryDate: optionalDate(value(formData, "expiryDate")) || new Date(), reminderDate: optionalDate(value(formData, "reminderDate")) || new Date(), resolved: value(formData, "resolved") === "on" } });
  revalidatePath("/dashboard/support");
  redirect(supportUrl(student.id, "saved", "Document reminder updated"));
}
export async function resolveDocumentReminder(formData: FormData) {
  const { user, student } = await requireStudent(value(formData, "studentId"));
  requireSupportManager(user.role);
  await db.documentExpiryReminder.update({ where: { id: value(formData, "id"), schoolId: student.schoolId, studentId: student.id }, data: { resolved: true } });
  revalidatePath("/dashboard/support");
  redirect(supportUrl(student.id, "saved", "Document reminder resolved"));
}
