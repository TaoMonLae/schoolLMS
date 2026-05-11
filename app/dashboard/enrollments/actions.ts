"use server";
import { EnrollmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { canManageStudents } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { tenantFilter } from "@/lib/tenant";

export async function enrollStudent(formData: FormData) {
  const user = await getRequiredCurrentUser();
  if (!canManageStudents(user.role)) throw new Error("Not authorized to enroll students");
  const schoolId = tenantFilter(user).schoolId;
  const studentId = String(formData.get("studentId") || "");
  const classId = String(formData.get("classId") || "");
  const [student, classRecord] = await Promise.all([
    db.student.findFirst({ where: { id: studentId, schoolId, deletedAt: null } }),
    db.class.findFirst({ where: { id: classId, schoolId } })
  ]);
  if (!student || !classRecord) throw new Error("Student or class not found for this school");
  await db.$transaction(async (tx) => {
    await tx.enrollment.updateMany({ where: { schoolId, studentId, status: "ACTIVE" }, data: { status: "TRANSFERRED", endDate: new Date() } });
    await tx.enrollment.create({ data: { schoolId, studentId, classId, status: EnrollmentStatus.ACTIVE, startDate: new Date() } });
  });
  revalidatePath("/dashboard/enrollments");
}
