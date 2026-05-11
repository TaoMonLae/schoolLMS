import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StudentPhoto } from "@/components/student-photo";
import { canManageGrades } from "@/lib/rbac";
import { formatEnumLabel } from "@/lib/students";
import { getRequiredCurrentUser } from "@/lib/session";
import { getAssignmentForUser, getSubmissionsForAssignment } from "@/lib/lms";

type AssignmentPageProps = { params: Promise<{ assignmentId: string }> };

export default async function AssignmentPage({ params }: AssignmentPageProps) {
  const { assignmentId } = await params;
  const currentUser = await getRequiredCurrentUser();
  const assignment = await getAssignmentForUser(currentUser, assignmentId);
  if (!assignment) notFound();
  const rows = await getSubmissionsForAssignment(currentUser, assignment.id);
  const canGrade = canManageGrades(currentUser.role);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader eyebrow="Assignment" title={assignment.title} description={`${assignment.class.name} | ${assignment.subject.name} | ${assignment.maxPoints} points`} />
      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Submission Status</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-rice">
              <tr>{["Student", "Status", "Submitted", "Score", "Feedback"].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-moss">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(({ student, submission }) => (
                <tr key={student.id}>
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><StudentPhoto student={student} size="sm" /><span className="font-semibold text-ink">{student.preferredName || student.legalName}</span></div></td>
                  <td className="px-4 py-3 text-moss">{formatEnumLabel(submission?.status || "NOT_SUBMITTED")}</td>
                  <td className="px-4 py-3 text-moss">{submission?.submittedAt?.toISOString().slice(0, 10) || "-"}</td>
                  <td className="px-4 py-3">{canGrade ? <input defaultValue={submission?.points ?? undefined} placeholder="--" className="w-20 rounded-md border border-line px-2 py-1" /> : submission?.points ?? "-"}</td>
                  <td className="px-4 py-3">{canGrade ? <input defaultValue={submission?.feedback ?? undefined} placeholder="Feedback" className="w-full rounded-md border border-line px-2 py-1" /> : submission?.feedback || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
