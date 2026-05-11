import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getSubjectName, getVisibleAssignments, getVisibleSubjects } from "@/lib/lms";
import { demoCurrentUser, formatEnumLabel } from "@/lib/students";

type AssignmentsPageProps = { searchParams?: Promise<{ subjectId?: string }> };

export default async function AssignmentsPage({ searchParams }: AssignmentsPageProps) {
  const params = await searchParams;
  const selectedSubject = params?.subjectId || "ALL";
  const assignments = getVisibleAssignments(demoCurrentUser, selectedSubject);
  const subjects = getVisibleSubjects(demoCurrentUser);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader eyebrow="Assignments" title="Assignments" description="Track submission status and open teacher grading tables." />
      <form className="flex gap-3 rounded-lg border border-line bg-white p-4 shadow-soft">
        <select name="subjectId" defaultValue={selectedSubject} className="h-11 rounded-md border border-line bg-rice px-3 text-sm text-ink">
          <option value="ALL">All subjects</option>
          {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
        </select>
        <button className="rounded-md bg-ink px-4 text-sm font-bold text-white">Filter</button>
      </form>
      <section className="grid gap-4 lg:grid-cols-2">
        {assignments.map((assignment) => (
          <article key={assignment.id} className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-clay">{assignment.className} | {getSubjectName(assignment.subjectId)}</p>
            <Link href={`/dashboard/assignments/${assignment.id}`} className="mt-2 block text-xl font-semibold text-ink hover:text-clay">{assignment.title}</Link>
            <p className="mt-2 text-sm leading-6 text-moss">{assignment.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-moss">
              <span className="rounded-md bg-rice px-2 py-1">Due {assignment.dueDate}</span>
              <span className="rounded-md bg-rice px-2 py-1">{assignment.maxPoints} pts</span>
              <span className="rounded-md bg-rice px-2 py-1">{formatEnumLabel(assignment.status)}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
