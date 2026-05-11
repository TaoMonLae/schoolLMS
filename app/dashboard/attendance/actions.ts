"use server";

import { redirect } from "next/navigation";
import { demoCurrentUser } from "@/lib/students";

export async function saveAttendanceBulk(formData: FormData) {
  const classId = String(formData.get("classId") || "");
  const date = String(formData.get("date") || "");
  const studentIds = formData.getAll("studentId").map(String);
  const uniqueKeys = new Set<string>();

  for (const studentId of studentIds) {
    const key = `${demoCurrentUser.schoolId}:${classId}:${studentId}:${date}`;

    if (uniqueKeys.has(key)) {
      redirect(`/dashboard/attendance?classId=${classId}&date=${date}&duplicate=1`);
    }

    uniqueKeys.add(key);
  }

  redirect(`/dashboard/attendance?classId=${classId}&date=${date}&saved=${studentIds.length}`);
}
