"use server";

import { ExamStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { canManageGrades } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { tenantFilter } from "@/lib/tenant";

function text(formData: FormData, key: string) { return String(formData.get(key) || "").trim(); }
async function ctx() { const user = await getRequiredCurrentUser(); if (!canManageGrades(user.role)) throw new Error("Not authorized to manage exams"); const schoolId = tenantFilter(user).schoolId; return { user, schoolId }; }
async function assertClass(user: Awaited<ReturnType<typeof getRequiredCurrentUser>>, schoolId: string, classId: string) { const klass = await db.class.findFirst({ where: { id: classId, schoolId, ...(user.role === "TEACHER" ? { id: { in: user.assignedClassIds } } : {}) } }); if (!klass) throw new Error("Class not available"); }
async function assertSubject(schoolId: string, subjectId: string) { const subject = await db.subject.findFirst({ where: { id: subjectId, schoolId } }); if (!subject) throw new Error("Subject not found"); }
function examDate(formData: FormData) { const raw = text(formData, "examDate"); return raw ? new Date(raw) : null; }
function maxMarks(formData: FormData) { return Math.max(1, Number(text(formData, "maxMarks") || 100)); }
function status(formData: FormData) { return (text(formData, "status") || "DRAFT") as ExamStatus; }

export async function createExam(formData: FormData) { const { user, schoolId } = await ctx(); const classId = text(formData, "classId"); const subjectId = text(formData, "subjectId"); await assertClass(user, schoolId, classId); await assertSubject(schoolId, subjectId); await db.exam.create({ data: { schoolId, classId, subjectId, title: text(formData, "title"), description: text(formData, "description") || null, examDate: examDate(formData), maxMarks: maxMarks(formData), status: status(formData), createdById: user.id } }); revalidatePath("/dashboard/exams"); redirect("/dashboard/exams?saved=created"); }
export async function updateExam(formData: FormData) { const { user, schoolId } = await ctx(); const id = text(formData, "id"); const existing = await db.exam.findFirst({ where: { id, schoolId } }); if (!existing) throw new Error("Exam not found"); const classId = text(formData, "classId"); const subjectId = text(formData, "subjectId"); await assertClass(user, schoolId, classId); await assertSubject(schoolId, subjectId); await db.exam.update({ where: { id }, data: { classId, subjectId, title: text(formData, "title"), description: text(formData, "description") || null, examDate: examDate(formData), maxMarks: maxMarks(formData), status: status(formData) } }); revalidatePath("/dashboard/exams"); redirect("/dashboard/exams?saved=updated"); }
export async function deleteExam(formData: FormData) { const { schoolId } = await ctx(); const id = text(formData, "id"); const exam = await db.exam.findFirst({ where: { id, schoolId } }); if (!exam) throw new Error("Exam not found"); await db.exam.delete({ where: { id } }); revalidatePath("/dashboard/exams"); redirect("/dashboard/exams?saved=deleted"); }
export async function saveExamMarks(formData: FormData) { const { user, schoolId } = await ctx(); const examId = text(formData, "examId"); const exam = await db.exam.findFirst({ where: { id: examId, schoolId } }); if (!exam) throw new Error("Exam not found"); await assertClass(user, schoolId, exam.classId); const students = await db.student.findMany({ where: { schoolId, enrollments: { some: { classId: exam.classId, status: "ACTIVE" } } }, select: { id: true } }); for (const student of students) { const markRaw = text(formData, `marks_${student.id}`); const feedback = text(formData, `feedback_${student.id}`); if (!markRaw && !feedback) continue; const marks = markRaw ? Number(markRaw) : 0; if (marks < 0 || marks > exam.maxMarks) throw new Error("Marks exceed max marks"); await db.examMark.upsert({ where: { schoolId_examId_studentId: { schoolId, examId, studentId: student.id } }, create: { schoolId, examId, studentId: student.id, marks, feedback: feedback || null, recordedById: user.id }, update: { marks, feedback: feedback || null, recordedById: user.id } }); } revalidatePath("/dashboard/exams"); redirect("/dashboard/exams?saved=marks"); }
