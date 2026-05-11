"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { canTakeAttendance } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { getAttendanceStudentsForUser } from "@/lib/attendance";
import { tenantFilter } from "@/lib/tenant";
import { AttendanceStatus } from "@/lib/types";

export async function saveAttendanceBulk(formData: FormData) {
  const user = await getRequiredCurrentUser();
  if (!canTakeAttendance(user.role)) throw new Error("Not authorized to take attendance");
  const classId = String(formData.get("classId") || "");
  const date = String(formData.get("date") || "");
  const attendanceDate = new Date(`${date}T00:00:00.000Z`);
  const students = await getAttendanceStudentsForUser(user, classId);
  const studentIds = formData.getAll("studentId").map(String).filter((id) => students.some((student) => student.id === id));
  const uniqueIds = new Set(studentIds);

  if (uniqueIds.size !== studentIds.length) redirect(`/dashboard/attendance?classId=${classId}&date=${date}&duplicate=1`);

  await db.$transaction(
    studentIds.map((studentId) =>
      db.attendance.upsert({
        where: { schoolId_studentId_classId_date: { schoolId: tenantFilter(user).schoolId, studentId, classId, date: attendanceDate } },
        update: { status: String(formData.get(`status-${studentId}`) || "PRESENT") as AttendanceStatus, note: String(formData.get(`note-${studentId}`) || "").trim() || null, recordedById: user.id },
        create: { schoolId: tenantFilter(user).schoolId, studentId, classId, date: attendanceDate, status: String(formData.get(`status-${studentId}`) || "PRESENT") as AttendanceStatus, note: String(formData.get(`note-${studentId}`) || "").trim() || null, recordedById: user.id }
      })
    )
  );
  revalidatePath("/dashboard/attendance");
  redirect(`/dashboard/attendance?classId=${classId}&date=${date}&saved=${studentIds.length}`);
}
