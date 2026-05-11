import { EnrollmentStatus } from "@prisma/client";

export type ActiveEnrollmentSnapshot = { id: string; classId: string } | null;
export type EnrollmentDecision =
  | { type: "initial"; message: string }
  | { type: "transfer"; transferEnrollmentId: string; message: string }
  | { type: "same-class"; message: string };

export function startOfUtcDay(value = new Date()) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function planEnrollment(currentActive: ActiveEnrollmentSnapshot, targetClassId: string): EnrollmentDecision {
  if (currentActive?.classId === targetClassId) return { type: "same-class", message: "Student is already enrolled in this class" };
  if (currentActive) return { type: "transfer", transferEnrollmentId: currentActive.id, message: "Student transferred successfully" };
  return { type: "initial", message: "Student enrolled successfully" };
}

export function activeEnrollmentInvariant(enrollments: { status: EnrollmentStatus | "ACTIVE" | string }[]) {
  return enrollments.filter((enrollment) => enrollment.status === "ACTIVE").length <= 1;
}
