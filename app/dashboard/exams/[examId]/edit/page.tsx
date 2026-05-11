import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { updateExam, deleteExam } from "@/app/dashboard/exams/actions";
import { ExamForm } from "@/app/dashboard/exams/new/page";
import { getVisibleClassesForLearning, getVisibleExams, getVisibleSubjects } from "@/lib/lms";
import { canManageGrades } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";

export default async function EditExamPage({ params }: { params: Promise<{ examId: string }> }) { const { examId } = await params; const user = await getRequiredCurrentUser(); if (!canManageGrades(user.role)) redirect("/dashboard/exams"); const [exams, classes, subjects] = await Promise.all([getVisibleExams(user), getVisibleClassesForLearning(user), getVisibleSubjects(user)]); const exam = exams.find((item) => item.id === examId); if (!exam) notFound(); return <div className="space-y-6 pb-10"><PageHeader eyebrow="Exams" title="Edit Exam" description="Update exam workflow state or delete it." /><ExamForm action={updateExam} classes={classes} subjects={subjects} exam={exam} /><form action={deleteExam}><input type="hidden" name="id" value={exam.id} /><button className="rounded-md border border-error/45 px-4 py-2 text-sm font-bold text-error">Delete Exam</button></form></div>; }
