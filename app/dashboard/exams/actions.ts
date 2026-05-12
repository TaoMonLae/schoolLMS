"use server";

import { ExamQuestionType, ExamStatus, GedSubjectType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { canManageGrades } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { tenantFilter } from "@/lib/tenant";

type BuilderOption = { id?: string; optionText?: string; isCorrect?: boolean };
type BuilderQuestion = {
  id?: string;
  type?: string;
  prompt?: string;
  passage?: string;
  imageUrl?: string;
  explanation?: string;
  points?: number | string;
  correctAnswerText?: string;
  correctAnswerJson?: Prisma.InputJsonValue;
  allowCalculator?: boolean;
  difficulty?: string;
  options?: BuilderOption[];
};
type BuilderSection = {
  id?: string;
  title?: string;
  description?: string;
  instructions?: string;
  durationMinutes?: number | string | null;
  marks?: number | string;
  questions?: BuilderQuestion[];
};
type BuilderPayload = { sections?: BuilderSection[] };

function text(formData: FormData, key: string) { return String(formData.get(key) || "").trim(); }
async function ctx() { const user = await getRequiredCurrentUser(); if (!canManageGrades(user.role)) throw new Error("Not authorized to manage exams"); const schoolId = tenantFilter(user).schoolId; return { user, schoolId }; }
async function assertClass(user: Awaited<ReturnType<typeof getRequiredCurrentUser>>, schoolId: string, classId: string) { const klass = await db.class.findFirst({ where: { id: classId, schoolId, ...(user.role === "TEACHER" ? { id: { in: user.assignedClassIds } } : {}) } }); if (!klass) throw new Error("Class not available"); }
async function assertSubject(schoolId: string, subjectId: string) { const subject = await db.subject.findFirst({ where: { id: subjectId, schoolId } }); if (!subject) throw new Error("Subject not found"); }
function examDate(formData: FormData) { const raw = text(formData, "examDate"); return raw ? new Date(raw) : null; }
function intValue(formData: FormData, key: string, fallback = 0) { const raw = text(formData, key); return raw ? Math.max(0, Number(raw)) : fallback; }
function maxMarks(formData: FormData) { return Math.max(1, intValue(formData, "maxMarks", 100)); }
function status(formData: FormData) {
  const raw = text(formData, "intentStatus") || text(formData, "status") || "DRAFT";
  if (["DRAFT", "PUBLISHED", "CLOSED", "SCHEDULED", "COMPLETED"].includes(raw)) return raw as ExamStatus;
  return "DRAFT" as ExamStatus;
}
function gedSubjectType(formData: FormData) {
  const raw = text(formData, "gedSubjectType") || "CUSTOM";
  if (["RLA", "MATH", "SCIENCE", "SOCIAL_STUDIES", "CUSTOM"].includes(raw)) return raw as GedSubjectType;
  return "CUSTOM" as GedSubjectType;
}
function parseBuilder(formData: FormData): BuilderPayload {
  const raw = text(formData, "builderJson");
  if (!raw) return { sections: [] };
  return JSON.parse(raw) as BuilderPayload;
}
function numberOrNull(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : null;
}
function questionType(value?: string) {
  if (value && Object.values(ExamQuestionType).includes(value as ExamQuestionType)) return value as ExamQuestionType;
  return "MULTIPLE_CHOICE" as ExamQuestionType;
}
function cleanJson(value: Prisma.InputJsonValue | undefined) {
  return value === undefined || value === null || value === "" ? Prisma.JsonNull : value;
}
function validateBuilder(formData: FormData, builder: BuilderPayload) {
  const nextStatus = status(formData);
  const warnings: string[] = [];
  const sections = builder.sections || [];
  const questions = sections.flatMap((section) => section.questions || []);
  if (!questions.length) warnings.push("Draft has no questions yet.");
  if (nextStatus !== "PUBLISHED") return warnings;
  if (!text(formData, "classId")) throw new Error("Class is required before publishing.");
  if (!text(formData, "subjectId")) throw new Error("Subject is required before publishing.");
  if (!text(formData, "title")) throw new Error("Title is required before publishing.");
  if (!intValue(formData, "totalDurationMinutes")) throw new Error("Duration is required before publishing.");
  if (!sections.length) throw new Error("At least one section is required before publishing.");
  if (!questions.length) throw new Error("At least one question is required before publishing.");
  for (const [sectionIndex, section] of sections.entries()) {
    for (const [questionIndex, question] of (section.questions || []).entries()) {
      const label = `Section ${sectionIndex + 1}, question ${questionIndex + 1}`;
      if (!question.prompt?.trim()) throw new Error(`${label} needs a prompt.`);
      if (!numberOrNull(question.points)) throw new Error(`${label} needs points.`);
      const type = questionType(question.type);
      if (type === "MULTIPLE_CHOICE" || type === "MULTIPLE_SELECT" || type === "PASSAGE_BASED") {
        const options = (question.options || []).filter((option) => option.optionText?.trim());
        const min = 2;
        const max = type === "MULTIPLE_SELECT" ? 8 : 6;
        if (options.length < min || options.length > max) throw new Error(`${label} needs ${min}-${max} non-empty options.`);
        const correctCount = options.filter((option) => option.isCorrect).length;
        if (type === "MULTIPLE_CHOICE" && correctCount !== 1) throw new Error(`${label} needs exactly one correct option.`);
        if (type === "MULTIPLE_SELECT" && correctCount < 1) throw new Error(`${label} needs at least one correct option.`);
      }
    }
  }
  return warnings;
}
async function writeSections(examId: string, builder: BuilderPayload) {
  await db.examSection.deleteMany({ where: { examId } });
  for (const [sectionIndex, section] of (builder.sections || []).entries()) {
    const createdSection = await db.examSection.create({
      data: {
        examId,
        title: section.title?.trim() || `Section ${sectionIndex + 1}`,
        description: section.description?.trim() || null,
        instructions: section.instructions?.trim() || null,
        orderIndex: sectionIndex,
        durationMinutes: numberOrNull(section.durationMinutes),
        marks: numberOrNull(section.marks) || 0
      }
    });
    for (const [questionIndex, question] of (section.questions || []).entries()) {
      const createdQuestion = await db.examQuestion.create({
        data: {
          examId,
          sectionId: createdSection.id,
          type: questionType(question.type),
          prompt: question.prompt?.trim() || "Untitled question",
          passage: question.passage?.trim() || null,
          imageUrl: question.imageUrl?.trim() || null,
          explanation: question.explanation?.trim() || null,
          points: numberOrNull(question.points) || 1,
          orderIndex: questionIndex,
          correctAnswerText: question.correctAnswerText?.trim() || null,
          correctAnswerJson: cleanJson(question.correctAnswerJson),
          allowCalculator: Boolean(question.allowCalculator),
          difficulty: question.difficulty?.trim() || null
        }
      });
      const options = (question.options || []).filter((option) => option.optionText?.trim()).slice(0, 8);
      for (const [optionIndex, option] of options.entries()) {
        await db.examQuestionOption.create({ data: { questionId: createdQuestion.id, optionText: option.optionText!.trim(), isCorrect: Boolean(option.isCorrect), orderIndex: optionIndex } });
      }
    }
  }
}

export async function createExam(formData: FormData) {
  const { user, schoolId } = await ctx();
  const classId = text(formData, "classId");
  const subjectId = text(formData, "subjectId");
  await assertClass(user, schoolId, classId);
  await assertSubject(schoolId, subjectId);
  const builder = parseBuilder(formData);
  validateBuilder(formData, builder);
  const exam = await db.exam.create({ data: { schoolId, classId, subjectId, title: text(formData, "title"), description: text(formData, "description") || null, instructions: text(formData, "instructions") || null, examDate: examDate(formData), totalDurationMinutes: numberOrNull(text(formData, "totalDurationMinutes")), maxMarks: maxMarks(formData), passingScore: numberOrNull(text(formData, "passingScore")), status: status(formData), gedSubjectType: gedSubjectType(formData), createdById: user.id } });
  await writeSections(exam.id, builder);
  revalidatePath("/dashboard/exams");
  redirect(`/dashboard/exams/${exam.id}/edit?saved=created`);
}
export async function updateExam(formData: FormData) {
  const { user, schoolId } = await ctx();
  const id = text(formData, "id");
  const existing = await db.exam.findFirst({ where: { id, schoolId } });
  if (!existing) throw new Error("Exam not found");
  const classId = text(formData, "classId");
  const subjectId = text(formData, "subjectId");
  await assertClass(user, schoolId, classId);
  await assertSubject(schoolId, subjectId);
  const builder = parseBuilder(formData);
  validateBuilder(formData, builder);
  await db.exam.update({ where: { id }, data: { classId, subjectId, title: text(formData, "title"), description: text(formData, "description") || null, instructions: text(formData, "instructions") || null, examDate: examDate(formData), totalDurationMinutes: numberOrNull(text(formData, "totalDurationMinutes")), maxMarks: maxMarks(formData), passingScore: numberOrNull(text(formData, "passingScore")), status: status(formData), gedSubjectType: gedSubjectType(formData) } });
  await writeSections(id, builder);
  revalidatePath("/dashboard/exams");
  revalidatePath(`/dashboard/exams/${id}/preview`);
  redirect(`/dashboard/exams/${id}/edit?saved=updated`);
}
export async function setExamStatus(formData: FormData) {
  const { schoolId } = await ctx();
  const id = text(formData, "id");
  const exam = await db.exam.findFirst({ where: { id, schoolId } });
  if (!exam) throw new Error("Exam not found");
  await db.exam.update({ where: { id }, data: { status: status(formData) } });
  revalidatePath("/dashboard/exams");
}
export async function deleteExam(formData: FormData) { const { schoolId } = await ctx(); const id = text(formData, "id"); const exam = await db.exam.findFirst({ where: { id, schoolId } }); if (!exam) throw new Error("Exam not found"); await db.exam.delete({ where: { id } }); revalidatePath("/dashboard/exams"); redirect("/dashboard/exams?saved=deleted"); }
export async function saveExamMarks(formData: FormData) { const { user, schoolId } = await ctx(); const examId = text(formData, "examId"); const exam = await db.exam.findFirst({ where: { id: examId, schoolId } }); if (!exam) throw new Error("Exam not found"); await assertClass(user, schoolId, exam.classId); const students = await db.student.findMany({ where: { schoolId, enrollments: { some: { classId: exam.classId, status: "ACTIVE" } } }, select: { id: true } }); for (const student of students) { const markRaw = text(formData, `marks_${student.id}`); const feedback = text(formData, `feedback_${student.id}`); if (!markRaw && !feedback) continue; const marks = markRaw ? Number(markRaw) : 0; if (marks < 0 || marks > exam.maxMarks) throw new Error("Marks exceed max marks"); await db.examMark.upsert({ where: { schoolId_examId_studentId: { schoolId, examId, studentId: student.id } }, create: { schoolId, examId, studentId: student.id, marks, feedback: feedback || null, recordedById: user.id }, update: { marks, feedback: feedback || null, recordedById: user.id } }); } revalidatePath("/dashboard/exams"); redirect("/dashboard/exams?saved=marks"); }
