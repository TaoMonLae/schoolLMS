import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StudentPhoto } from "@/components/student-photo";
import { getVisibleStudentsForUser } from "@/lib/students";
import { getRequiredCurrentUser } from "@/lib/session";
import { getDefaultReportStudentId, getStudentReportCard } from "@/lib/lms";

type GradesPageProps = { searchParams?: Promise<{ studentId?: string }> };

export default async function GradesPage({ searchParams }: GradesPageProps) {
  const params = await searchParams;
  const currentUser = await getRequiredCurrentUser();
  const studentId = params?.studentId || await getDefaultReportStudentId(currentUser);
  const report = studentId ? await getStudentReportCard(currentUser, studentId) : undefined;
  const activeStudents = await getVisibleStudentsForUser(currentUser, { status: "ACTIVE" });

  return (
    <div className="space-y-6 pb-10">
      <PageHeader eyebrow="Grades" title="Student Grade Dashboard" description="GED-style progress tracking, grade calculation, report card, and parent-friendly summary." />
      <form className="flex flex-col gap-3 rounded-lg border border-line bg-white p-4 shadow-soft sm:flex-row">
        <select name="studentId" defaultValue={studentId} className="h-11 rounded-md border border-line bg-rice px-3 text-sm text-ink">
          {activeStudents.map((student) => <option key={student.id} value={student.id}>{student.preferredName || student.legalName}</option>)}
        </select>
        <button className="rounded-md bg-ink px-4 text-sm font-bold text-white">Load Report</button>
      </form>
      {report ? (
        <>
          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <StudentPhoto student={report.student} size="lg" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-clay">{report.student.studentNumber}</p>
                  <h2 className="text-2xl font-semibold text-ink">{report.student.preferredName || report.student.legalName}</h2>
                  <p className="mt-1 text-sm text-moss">{report.student.className}</p>
                </div>
              </div>
              <div className="rounded-lg bg-rice p-4 text-center">
                <p className="text-3xl font-semibold text-ink">{report.overall}%</p>
                <p className="text-sm font-semibold text-moss">{report.band}</p>
              </div>
            </div>
          </section>
          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-ink">Report Card</h2>
              <Link href={`/dashboard/grades/report/${report.student.id}/pdf`} className="rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">Export PDF</Link>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-line text-sm">
                <thead className="bg-rice"><tr>{["Subject", "Assignments", "Exams", "Grade", "Progress"].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-moss">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-line">
                  {report.rows.map((row) => (
                    <tr key={row.subject.id}>
                      <td className="px-4 py-3 font-semibold text-ink">{row.subject.name}</td>
                      <td className="px-4 py-3 text-moss">{row.assignmentCount}</td>
                      <td className="px-4 py-3 text-moss">{row.examCount}</td>
                      <td className="px-4 py-3 text-moss">{row.percent ? `${row.percent}%` : "-"}</td>
                      <td className="px-4 py-3"><span className="rounded-md bg-rice px-2 py-1 text-xs font-semibold text-moss">{row.band}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Parent-Friendly Progress Summary</h2>
            <p className="mt-3 text-sm leading-7 text-moss">{report.parentSummary}</p>
          </section>
        </>
      ) : null}
    </div>
  );
}
