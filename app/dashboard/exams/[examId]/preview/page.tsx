import { Clock, EyeOff } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getExamForUser } from "@/lib/lms";
import { canManageGrades } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { formatEnumLabel } from "@/lib/students";

export const dynamic = "force-dynamic";

export default async function ExamPreviewPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const user = await getRequiredCurrentUser();
  const exam = await getExamForUser(user, examId);
  if (!exam) notFound();
  if (user.role === "STUDENT" && exam.status !== "PUBLISHED") redirect("/dashboard/exams");
  const canManage = canManageGrades(user.role);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader eyebrow="Student Preview" title={exam.title} description="Preview exam instructions, timers, sections, and questions exactly as students will see them. Correct answers are hidden." />
        <div className="flex flex-wrap gap-2">
          {canManage ? <Link href={`/dashboard/exams/${exam.id}/edit`} className="rounded-md border border-border px-4 py-2 text-sm font-bold text-foreground">Edit Builder</Link> : null}
          <Link href="/dashboard/exams" className="rounded-md bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground">Return to exam list</Link>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-5 text-foreground shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-orange">{exam.class.name} • {exam.subject.name} • {formatEnumLabel(exam.gedSubjectType)}</p>
            <h2 className="mt-2 text-2xl font-semibold">{exam.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{exam.description}</p>
            {exam.instructions ? <div className="mt-4 rounded-md border border-border bg-secondary p-4 text-sm text-secondary-foreground"><p className="font-semibold">Instructions</p><p className="mt-2 whitespace-pre-line">{exam.instructions}</p></div> : null}
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-semibold">
            <span className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-primary-foreground"><Clock className="h-4 w-4" /> Exam timer: {exam.totalDurationMinutes || "not set"} min</span>
            <span className="rounded-md bg-secondary px-3 py-2 text-secondary-foreground">Max marks: {exam.maxMarks}</span>
            <span className="rounded-md bg-secondary px-3 py-2 text-secondary-foreground">Passing: {exam.passingScore ?? "not set"}</span>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        {exam.sections.map((section, sectionIndex) => (
          <article key={section.id} className="rounded-lg border border-border bg-card p-5 text-foreground shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-brand-orange">Section {sectionIndex + 1}</p>
                <h3 className="text-xl font-semibold">{section.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                {section.instructions ? <p className="mt-2 whitespace-pre-line text-sm text-foreground">{section.instructions}</p> : null}
              </div>
              {section.durationMinutes ? <span className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-bold text-secondary-foreground"><Clock className="h-4 w-4" /> {section.durationMinutes} min</span> : null}
            </div>
            <div className="mt-4 space-y-4">
              {section.questions.map((question, questionIndex) => (
                <div key={question.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{questionIndex + 1}. {question.prompt}</p>
                    <span className="rounded-md bg-secondary px-2 py-1 text-xs font-bold text-secondary-foreground">{question.points} pts • {formatEnumLabel(question.type)}</span>
                  </div>
                  {question.passage ? <div className="mt-3 whitespace-pre-line rounded-md border border-border bg-card p-4 text-sm text-foreground">{question.passage}</div> : null}
                  {question.imageUrl ? <div className="mt-3 rounded-md border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">Image stimulus: {question.imageUrl}</div> : null}
                  {question.options.length ? (
                    <div className="mt-3 space-y-2">
                      {question.options.map((option, optionIndex) => <div key={option.id} className="rounded-md border border-border bg-card px-3 py-2 text-sm"><span className="mr-2 font-semibold">{String.fromCharCode(65 + optionIndex)}.</span>{option.optionText}</div>)}
                    </div>
                  ) : <div className="mt-3 rounded-md border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">Student response area</div>}
                  {question.allowCalculator ? <p className="mt-3 text-xs font-semibold text-muted-foreground">Calculator/formula tools allowed for this question.</p> : null}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground"><EyeOff className="mr-2 inline h-4 w-4" /> Teacher note: correct answers, scoring JSON, and explanations are not shown in student preview mode.</div>
    </div>
  );
}
