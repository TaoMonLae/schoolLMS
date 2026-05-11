"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { classMutationErrorMessage, normalizeClassName } from "@/lib/classes";
import { canManageClasses } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { tenantFilter } from "@/lib/tenant";

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

async function requireClassManager() {
  const user = await getRequiredCurrentUser();
  if (!canManageClasses(user.role)) throw new Error("Not authorized to manage classes");
  const schoolId = tenantFilter(user).schoolId;
  return { user, schoolId };
}

async function validateTeacher(schoolId: string, teacherId: string | null) {
  if (!teacherId) return null;
  const teacher = await db.user.findFirst({ where: { id: teacherId, schoolId, role: "TEACHER", isActive: true } });
  if (!teacher) throw new Error("Teacher not found for this school");
  return teacherId;
}

export async function createClass(formData: FormData) {
  const { schoolId } = await requireClassManager();
  const teacherId = await validateTeacher(schoolId, value(formData, "teacherId") || null);
  try {
    await db.class.create({
      data: {
        schoolId,
        name: normalizeClassName(value(formData, "name")),
        academicYear: value(formData, "academicYear") || String(new Date().getFullYear()),
        gradeLevel: value(formData, "gradeLevel") || null,
        room: value(formData, "room") || null,
        teacherId
      }
    });
  } catch (error) {
    redirect(`/dashboard/classes?error=${encodeURIComponent(classMutationErrorMessage(error))}`);
  }
  revalidatePath("/dashboard/classes");
  redirect("/dashboard/classes?saved=created");
}

export async function updateClass(formData: FormData) {
  const { schoolId } = await requireClassManager();
  const id = value(formData, "id");
  const existing = await db.class.findFirst({ where: { id, schoolId } });
  if (!existing) throw new Error("Class not found");
  const teacherId = await validateTeacher(schoolId, value(formData, "teacherId") || null);
  try {
    await db.class.update({
      where: { id },
      data: {
        name: normalizeClassName(value(formData, "name")),
        academicYear: value(formData, "academicYear") || existing.academicYear,
        gradeLevel: value(formData, "gradeLevel") || null,
        room: value(formData, "room") || null,
        teacherId
      }
    });
  } catch (error) {
    redirect(`/dashboard/classes/${id}/edit?error=${encodeURIComponent(classMutationErrorMessage(error))}`);
  }
  revalidatePath("/dashboard/classes");
  revalidatePath(`/dashboard/classes/${id}`);
  redirect(`/dashboard/classes/${id}?saved=updated`);
}

export async function deleteClassSafely(formData: FormData) {
  const { schoolId } = await requireClassManager();
  const id = value(formData, "id");
  const klass = await db.class.findFirst({
    where: { id, schoolId },
    include: { _count: { select: { enrollments: true, attendance: true, lessons: true, assignments: true, exams: true, videoLessons: true } } }
  });
  if (!klass) throw new Error("Class not found");
  const dependentCount = Object.values(klass._count).reduce((sum, count) => sum + count, 0);
  if (dependentCount > 0) redirect(`/dashboard/classes/${id}?error=dependencies`);
  await db.class.delete({ where: { id } });
  revalidatePath("/dashboard/classes");
  redirect("/dashboard/classes?saved=deleted");
}
