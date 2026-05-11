"use server";
import { EnrollmentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { planEnrollment, startOfUtcDay } from "@/lib/enrollments";
import { canManageStudents } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { tenantFilter } from "@/lib/tenant";

function targetUrl(state: "success" | "error", message: string) {
  return `/dashboard/enrollments?${state}=${encodeURIComponent(message)}`;
}

export async function enrollStudent(formData: FormData) {
  const user = await getRequiredCurrentUser();
  if (!canManageStudents(user.role)) throw new Error("Not authorized to enroll students");
  const schoolId = tenantFilter(user).schoolId;
  const studentId = String(formData.get("studentId") || "");
  const classId = String(formData.get("classId") || "");
  const today = startOfUtcDay();
  const [student, classRecord] = await Promise.all([
    db.student.findFirst({ where: { id: studentId, schoolId, deletedAt: null } }),
    db.class.findFirst({ where: { id: classId, schoolId } })
  ]);
  if (!student || !classRecord) redirect(targetUrl("error", "Student or class not found for this school"));

  let result: { type: "initial" | "transfer" | "same-class"; message: string };
  try {
    result = await db.$transaction(async (tx) => {
      const active = await tx.enrollment.findFirst({ where: { schoolId, studentId, status: "ACTIVE" }, orderBy: { startDate: "desc" } });
      const decision = planEnrollment(active ? { id: active.id, classId: active.classId } : null, classId);
      if (decision.type === "same-class") return decision;

      if (decision.type === "transfer") {
        await tx.enrollment.updateMany({ where: { schoolId, studentId, status: "ACTIVE", classId: { not: classId } }, data: { status: "TRANSFERRED", endDate: today } });
      }

      const duplicateToday = await tx.enrollment.findFirst({ where: { schoolId, studentId, classId, startDate: today } });
      if (duplicateToday) return { type: "same-class" as const, message: "Student is already enrolled in this class" };

      await tx.enrollment.create({ data: { schoolId, studentId, classId, status: EnrollmentStatus.ACTIVE, startDate: today } });
      return decision;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") redirect(targetUrl("error", "Student is already enrolled in this class"));
    throw error;
  }

  revalidatePath("/dashboard/enrollments");
  revalidatePath("/dashboard/classes");
  redirect(targetUrl(result.type === "same-class" ? "error" : "success", result.message));
}
