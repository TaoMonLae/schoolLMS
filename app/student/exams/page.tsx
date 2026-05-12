import { Clock, FileText } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getPublishedExamsForStudent } from "@/lib/lms";
import { getRequiredCurrentUser } from "@/lib/session";
import { formatEnumLabel } from "@/lib/students";

export const dynamic = "force-dynamic";

export default async function StudentExamsPage() {
  const user = await getRequiredCurrentUser();
  const exams = user.role === "STUDENT" ? await getPublishedExamsForStudent(user) : [];
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8"><PageHeader eyebrow="Student Exams" title="Available Exams" description="Published class exams assigned to your active class. Online attempt security will be added later." />{user.role !== "STUDENT" ? <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">This student exam foundation is visible to student accounts only.</div> : null}<section className="grid gap-4 md:grid-cols-2">{exams.map((exam) => <article key={exam.id} className="rounded-lg border border-border bg-card p-5 text-foreground shadow-soft"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-brand-orange">{exam.class.name} • {exam.subject.name}</p><h2 className="mt-2 text-xl font-semibold">{exam.title}</h2><p className="mt-2 text-sm text-muted-foreground">{exam.description || exam.instructions || "Read the instructions before starting."}</p></div><FileText className="h-5 w-5 text-muted-foreground" /></div><div className="mt-4 flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-md bg-secondary px-2 py-1 text-secondary-foreground">{formatEnumLabel(exam.gedSubjectType)}</span><span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-secondary-foreground"><Clock className="h-3 w-3" /> {exam.totalDurationMinutes || "No"} min</span><span className="rounded-md bg-secondary px-2 py-1 text-secondary-foreground">{exam._count.sections} sections</span><span className="rounded-md bg-secondary px-2 py-1 text-secondary-foreground">{exam._count.questions} questions</span><span className="rounded-md bg-secondary px-2 py-1 text-secondary-foreground">{exam.maxMarks} marks</span></div><Link href={`/dashboard/exams/${exam.id}/preview`} className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Preview exam</Link></article>)}</section>{user.role === "STUDENT" && exams.length === 0 ? <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">No published exams are assigned to your active class yet.</div> : null}</main>;
}
