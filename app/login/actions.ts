"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { encodeSession, sessionCookieOptions } from "@/lib/session";

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const user = await db.user.findUnique({
    where: { email, isActive: true },
    include: { classes: { select: { id: true } }, student: { select: { id: true } } }
  });

  if (!user?.passwordHash) redirect("/login?error=invalid");

  const validHash = user.passwordHash.startsWith("$2") ? await bcrypt.compare(password, user.passwordHash) : false;
  const validSeedPlaceholder = process.env.NODE_ENV !== "production" && user.passwordHash === "replace-with-hashed-password" && password === "password";

  if (!validHash && !validSeedPlaceholder) redirect("/login?error=invalid");

  const cookieStore = await cookies();
  const options = sessionCookieOptions();
  cookieStore.set(options.name, encodeSession({
    userId: user.id,
    schoolId: user.schoolId || undefined,
    role: user.role,
    name: user.name,
    assignedClassIds: user.classes.map((classItem) => classItem.id),
    studentId: user.student?.id,
    approvedForSensitiveCaseNotes: user.caseManagerApproved
  }), options);

  redirect(user.role === "SUPER_ADMIN" ? "/super-admin" : "/dashboard");
}
