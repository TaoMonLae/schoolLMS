"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { canManageClasses } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { tenantFilter } from "@/lib/tenant";

export async function createClass(formData: FormData) {
  const user = await getRequiredCurrentUser();
  if (!canManageClasses(user.role)) throw new Error("Not authorized to manage classes");
  const schoolId = tenantFilter(user).schoolId;
  const teacherId = String(formData.get("teacherId") || "") || null;
  if (teacherId) {
    const teacher = await db.user.findFirst({ where: { id: teacherId, schoolId, role: "TEACHER", isActive: true } });
    if (!teacher) throw new Error("Teacher not found for this school");
  }
  await db.class.create({ data: { schoolId, name: String(formData.get("name") || "").trim(), academicYear: String(formData.get("academicYear") || new Date().getFullYear()), gradeLevel: String(formData.get("gradeLevel") || "").trim() || null, room: String(formData.get("room") || "").trim() || null, teacherId } });
  revalidatePath("/dashboard/classes");
}
