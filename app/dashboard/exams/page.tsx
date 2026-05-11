import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StudentPhoto } from "@/components/student-photo";
import { canManageGrades } from "@/lib/rbac";
import { formatEnumLabel, getVisibleStudentsForUser } from "@/lib/students";
import { getRequiredCurrentUser } from "@/lib/session";
import { getVisibleExams, getVisibleSubjects } from "@/lib/lms";

type ExamsPageProps = { searchParams?: Promise<{ subjectId?: string }> };

export default async function ExamsPage({ searchParams }: ExamsPageProps) {
  const params = await searchParams;
  const currentUser = await getRequiredCurrentUser();
  const selectedSubject = params?.subjectId || "ALL";
  const subjects = await getVisibleSubjects(currentUser);
  const exams = await getVisibleExams(currentUser, selectedSubject);
  const students = await getVisibleStudentsForUser(currentUser, { status: "ACTIVE" });
  const canManage = canManageGrades(currentUser.role);

  return <div className="space-y-6 pb-10">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><PageHeader eyebrow="Exams" title="Exams and Marks" description="Create exams, link them to class and subject, and enter marks per student." />{canManage ? <button className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Create Exam</button> : null}</div>
    <form className="flex gap-3 rounded-lg border border-line bg-white p-4 shadow-soft"><select name="subjectId" defaultValue={selectedSubject} className="h-11 rounded-md border border-line bg-rice px-3 text-sm text-ink"><option value="ALL">All subjects</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select><button className="rounded-md bg-ink px-4 text-sm font-bold text-white">Filter</button></form>
    <section className="space-y-4">{exams.map((exam) => { const classStudents = students.filter((student) => student.classId === exam.classId); return <article key={exam.id} className="rounded-lg border border-line bg-white p-5 shadow-soft"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-clay">{exam.class.name} | {exam.subject.name}</p><h2 className="mt-2 text-xl font-semibold text-ink">{exam.title}</h2><p className="mt-2 text-sm text-moss">{exam.description}</p></div><div className="flex flex-wrap gap-2 text-xs font-semibold text-moss"><span className="rounded-md bg-rice px-2 py-1">{exam.examDate?.toISOString().slice(0,10) || "Unscheduled"}</span><span className="rounded-md bg-rice px-2 py-1">{formatEnumLabel(exam.status)}</span></div></div><div className="mt-5 overflow-x-auto"><table className="min-w-full divide-y divide-line text-sm"><thead className="bg-rice"><tr>{["Student", "Marks", "Feedback"].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-moss">{h}</th>)}</tr></thead><tbody className="divide-y divide-line">{classStudents.map((student) => { const mark = exam.marks.find((item) => item.studentId === student.id); return <tr key={student.id}><td className="px-4 py-3"><div className="flex items-center gap-3"><StudentPhoto student={student} size="sm" /><span className="font-semibold text-ink">{student.preferredName || student.legalName}</span></div></td><td className="px-4 py-3">{canManage ? <input defaultValue={mark?.marks} placeholder="--" className="w-20 rounded-md border border-line px-2 py-1" /> : mark?.marks ?? "-"}/{exam.maxMarks}</td><td className="px-4 py-3">{canManage ? <input defaultValue={mark?.feedback ?? undefined} placeholder="Feedback" className="w-full rounded-md border border-line px-2 py-1" /> : mark?.feedback || "-"}</td></tr>; })}</tbody></table></div></article>; })}</section>
  </div>;
}
