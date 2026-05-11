"use server";

import { EnrollmentStatus, Gender, RefugeeDocumentType, StudentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { canManageStudents, canManageSensitiveStudentDocuments } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { assertTenantAccess, tenantFilter } from "@/lib/tenant";

function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  return value || null;
}

function optionalDate(formData: FormData, key: string) {
  const value = optionalString(formData, key);
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function studentPayload(formData: FormData, canManageDocuments: boolean) {
  return {
    studentNumber: String(formData.get("studentNumber") || "").trim(),
    legalName: optionalString(formData, "legalName"),
    preferredName: optionalString(formData, "preferredName"),
    dateOfBirth: optionalDate(formData, "dateOfBirth"),
    gender: String(formData.get("gender") || "NOT_SPECIFIED") as Gender,
    status: String(formData.get("status") || "ACTIVE") as StudentStatus,
    primaryLanguage: optionalString(formData, "primaryLanguage"),
    guardianName: optionalString(formData, "guardianName"),
    guardianRelationship: optionalString(formData, "guardianRelationship"),
    guardianPhone: optionalString(formData, "guardianPhone"),
    guardianEmail: optionalString(formData, "guardianEmail"),
    homeAddress: optionalString(formData, "homeAddress"),
    emergencyContactName: optionalString(formData, "emergencyContactName"),
    emergencyContactPhone: optionalString(formData, "emergencyContactPhone"),
    emergencyRelationship: optionalString(formData, "emergencyRelationship"),
    ...(canManageDocuments
      ? {
          unhcrStatus: optionalString(formData, "unhcrStatus"),
          documentType: optionalString(formData, "documentType") as RefugeeDocumentType | null,
          documentNumber: optionalString(formData, "documentNumber"),
          documentExpiryDate: optionalDate(formData, "documentExpiryDate")
        }
      : {})
  };
}

async function assertClassInTenant(classId: string, schoolId: string) {
  const classRecord = await db.class.findFirst({ where: { id: classId, schoolId } });
  if (!classRecord) throw new Error("Class not found for this school");
}

export async function createStudent(formData: FormData) {
  const user = await getRequiredCurrentUser();
  if (!canManageStudents(user.role)) throw new Error("Not authorized to create students");
  const schoolId = user.schoolId;
  if (!schoolId) throw new Error("School-scoped user required");
  assertTenantAccess(user, schoolId);

  const classId = String(formData.get("classId") || "");
  await assertClassInTenant(classId, schoolId);
  const payload = studentPayload(formData, canManageSensitiveStudentDocuments(user.role));

  const student = await db.student.create({ data: { ...payload, schoolId } });
  await db.enrollment.create({
    data: { schoolId, classId, studentId: student.id, status: EnrollmentStatus.ACTIVE, startDate: new Date() }
  });

  revalidatePath("/dashboard/students");
  redirect(`/dashboard/students/${student.id}`);
}

export async function updateStudent(studentId: string, formData: FormData) {
  const user = await getRequiredCurrentUser();
  if (!canManageStudents(user.role)) throw new Error("Not authorized to edit students");
  const existing = await db.student.findFirst({ where: { id: studentId, ...tenantFilter(user), deletedAt: null } });
  if (!existing) throw new Error("Student not found");

  const classId = String(formData.get("classId") || "");
  await assertClassInTenant(classId, existing.schoolId);
  const payload = studentPayload(formData, canManageSensitiveStudentDocuments(user.role));

  await db.$transaction(async (tx) => {
    await tx.student.update({ where: { id: studentId }, data: payload });
    const activeEnrollment = await tx.enrollment.findFirst({ where: { schoolId: existing.schoolId, studentId, status: "ACTIVE" } });
    if (activeEnrollment?.classId !== classId) {
      if (activeEnrollment) await tx.enrollment.update({ where: { id: activeEnrollment.id }, data: { status: "TRANSFERRED", endDate: new Date() } });
      await tx.enrollment.create({ data: { schoolId: existing.schoolId, studentId, classId, status: "ACTIVE", startDate: new Date() } });
    }
  });

  revalidatePath("/dashboard/students");
  redirect(`/dashboard/students/${studentId}`);
}

export async function softDeleteStudent(studentId: string) {
  const user = await getRequiredCurrentUser();
  if (!canManageStudents(user.role)) throw new Error("Not authorized to delete students");
  const student = await db.student.findFirst({ where: { id: studentId, ...tenantFilter(user), deletedAt: null } });
  if (!student) throw new Error("Student not found");
  await db.student.update({ where: { id: studentId }, data: { deletedAt: new Date(), status: "INACTIVE" } });
  revalidatePath("/dashboard/students");
  redirect("/dashboard/students?deleted=1");
}
