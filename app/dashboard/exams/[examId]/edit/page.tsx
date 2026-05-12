import { notFound, redirect } from "next/navigation";
import { deleteExam, updateExam } from "@/app/dashboard/exams/actions";
import { ExamBuilder } from "@/app/dashboard/exams/exam-builder";
import { getVisibleClassesForLearning, getVisibleSubjects, getVisibleExams } from "@/lib/lms";
import { canManageGrades } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";

type EditExamPageProps = { params: Promise<{ examId: string }>; searchParams?: Promise<{ saved?: string }> };

export const dynamic = "force-dynamic";

export default async function EditExamPage({ params, searchParams }: EditExamPageProps) {
  const [{ examId }, query] = await Promise.all([params, searchParams]);
  const user = await getRequiredCurrentUser();
  if (!canManageGrades(user.role)) redirect("/dashboard/exams");
  const [exams, classes, subjects] = await Promise.all([getVisibleExams(user), getVisibleClassesForLearning(user), getVisibleSubjects(user)]);
  const exam = exams.find((item) => item.id === examId);
  if (!exam) notFound();
  const seed = {
    id: exam.id,
    classId: exam.classId,
    subjectId: exam.subjectId,
    title: exam.title,
    description: exam.description,
    instructions: exam.instructions,
    examDate: exam.examDate?.toISOString() || null,
    totalDurationMinutes: exam.totalDurationMinutes,
    maxMarks: exam.maxMarks,
    passingScore: exam.passingScore,
    status: exam.status,
    gedSubjectType: exam.gedSubjectType,
    sections: exam.sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description || "",
      instructions: section.instructions || "",
      durationMinutes: section.durationMinutes || "",
      marks: section.marks,
      questions: section.questions.map((question) => ({
        id: question.id,
        type: question.type,
        prompt: question.prompt,
        passage: question.passage || "",
        imageUrl: question.imageUrl || "",
        explanation: question.explanation || "",
        points: question.points,
        correctAnswerText: question.correctAnswerText || "",
        correctAnswerJson: question.correctAnswerJson,
        allowCalculator: question.allowCalculator,
        difficulty: question.difficulty || "",
        options: question.options.map((option) => ({ id: option.id, optionText: option.optionText, isCorrect: option.isCorrect }))
      }))
    }))
  };
  return <div className="space-y-6 pb-10">{query?.saved ? <div className="rounded-lg border border-success/30 bg-tint-mint p-4 text-sm font-semibold text-success">Exam builder changes saved.</div> : null}<ExamBuilder action={updateExam} classes={classes} subjects={subjects} exam={seed} /><form action={deleteExam}><input type="hidden" name="id" value={exam.id} /><button className="rounded-md border border-error/45 px-4 py-2 text-sm font-bold text-error">Delete Exam</button></form></div>;
}
