import { BookOpen, FileUp, Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { deleteSubjectSafely } from "@/app/dashboard/lms/actions";
import { getVisibleLessons, getVisibleSubjects } from "@/lib/lms";
import { canManageLms } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";

type LmsPageProps = { searchParams?: Promise<{ subjectId?: string; saved?: string; error?: string }> };

export default async function LmsPage({ searchParams }: LmsPageProps) {
  const params = await searchParams;
  const currentUser = await getRequiredCurrentUser();
  const subjects = await getVisibleSubjects(currentUser);
  const selectedSubject = params?.subjectId || "ALL";
  const lessons = await getVisibleLessons(currentUser, selectedSubject);
  const canManage = canManageLms(currentUser.role);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader eyebrow="LMS" title="Lessons and Subjects" description="GED subjects, custom subjects, lesson files, and class learning materials." />
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/lms/subjects/new" className="inline-flex items-center gap-2 rounded-md border border-ink px-4 py-3 text-sm font-bold text-ink"><Plus className="h-4 w-4" />Create Subject</Link>
            <Link href="/dashboard/lms/new" className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-bold text-on-dark"><Plus className="h-4 w-4" />Create Lesson</Link>
          </div>
        ) : null}
      </div>
      {params?.saved ? <div className="rounded-lg border border-success/30 bg-tint-mint p-4 text-sm font-semibold text-success">LMS changes saved.</div> : null}
      {params?.error ? <div className="rounded-lg border border-error/30 bg-tint-rose p-4 text-sm font-semibold text-error">Delete blocked because dependent lessons, assignments, or exams exist.</div> : null}
      <section className="rounded-lg border border-hairline bg-canvas p-4 shadow-soft">
        <form className="flex flex-col gap-3 sm:flex-row">
          <select name="subjectId" defaultValue={selectedSubject} className="h-11 rounded-md border border-hairline bg-surface px-3 text-sm text-ink">
            <option value="ALL">All subjects</option>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
          <button className="rounded-md bg-ink px-4 py-2 text-sm font-bold text-on-dark">Filter</button>
        </form>
      </section>
      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-hairline bg-canvas p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Subjects</h2>
          <div className="mt-4 space-y-3">
            {subjects.map((subject) => (
              <div key={subject.id} className="rounded-md border border-hairline bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">{subject.name}</p>
                  <span className="rounded-md bg-canvas px-2 py-1 text-xs font-semibold text-slate">{subject.isGed ? "GED" : "Custom"}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate">{subject.description || "No description"}</p>
                {canManage ? (
                  <div className="mt-3 flex gap-3">
                    <Link href={`/dashboard/lms/subjects/${subject.id}/edit`} className="text-xs font-semibold text-ink">Edit</Link>
                    <form action={deleteSubjectSafely}>
                    <input type="hidden" name="id" value={subject.id} />
                    <button className="text-xs font-semibold text-error">Delete if unused</button>
                    </form>
                  </div>
                ) : null}
              </div>
            ))}
            {subjects.length === 0 ? <p className="text-sm text-slate">No subjects exist for this school yet.</p> : null}
          </div>
        </div>
        <div className="space-y-4">
          {lessons.map((lesson) => (
            <article key={lesson.id} className="rounded-lg border border-hairline bg-canvas p-5 shadow-soft">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-orange text-on-dark"><BookOpen className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate">{lesson.class.name} | {lesson.subject.name}</p>
                  <Link href={`/dashboard/lms/${lesson.id}`} className="mt-1 block text-lg font-semibold text-ink hover:text-brand-orange">{lesson.title}</Link>
                  <p className="mt-2 text-sm leading-6 text-slate">{lesson.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {lesson.files.map((file) => <span key={file.id} className="inline-flex items-center gap-2 rounded-md bg-surface px-3 py-2 text-xs font-semibold text-slate"><FileUp className="h-3.5 w-3.5" />{file.fileName}</span>)}
                    {canManage ? <Link href={`/dashboard/lms/${lesson.id}/edit`} className="rounded-md border border-hairline px-3 py-2 text-xs font-semibold text-ink">Edit</Link> : null}
                  </div>
                </div>
              </div>
            </article>
          ))}
          {lessons.length === 0 ? <div className="rounded-lg border border-hairline bg-canvas p-8 text-center text-sm text-slate shadow-soft">No lessons match this real class/subject scope.</div> : null}
          <div className="rounded-lg border border-dashed border-hairline bg-canvas p-5 text-sm text-slate">Lesson file metadata is DB-backed when records exist; binary object storage upload remains a storage-provider integration task.</div>
        </div>
      </section>
    </div>
  );
}
