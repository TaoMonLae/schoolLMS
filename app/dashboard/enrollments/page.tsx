import { PageHeader } from "@/components/page-header";
import { enrollStudent } from "@/app/dashboard/enrollments/actions";
import { db } from "@/lib/db";
import { canManageStudents } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { tenantFilter } from "@/lib/tenant";

type EnrollmentsPageProps = { searchParams?: Promise<{ success?: string; error?: string }> };

export default async function EnrollmentsPage({ searchParams }: EnrollmentsPageProps) {
  const params = await searchParams;
  const user = await getRequiredCurrentUser();
  const schoolFilter = tenantFilter(user);
  const [enrollments, students, classes] = await Promise.all([
    db.enrollment.findMany({ where: { ...schoolFilter, ...(user.role === "TEACHER" ? { classId: { in: user.assignedClassIds } } : {}) }, include: { student: true, class: true }, orderBy: { startDate: "desc" } }),
    db.student.findMany({ where: { ...schoolFilter, deletedAt: null }, orderBy: { studentNumber: "asc" } }),
    db.class.findMany({ where: schoolFilter, orderBy: { name: "asc" } })
  ]);
  const canManage = canManageStudents(user.role);
  return <div className="space-y-6 pb-10"><PageHeader eyebrow="Enrollments" title="Enrollment Tracking" description="Connect students to classes with tenant-scoped enrollment histories." />
    {params?.success ? <div className="rounded-lg border border-[#b9dfac] bg-[#e8f3dc] p-4 text-sm font-semibold text-[#315933]">{params.success}</div> : null}
    {params?.error ? <div className="rounded-lg border border-[#efb4a9] bg-[#fff1ee] p-4 text-sm font-semibold text-[#8a3b2d]">{params.error}</div> : null}
    {canManage ? <form action={enrollStudent} className="grid gap-3 rounded-lg border border-line bg-white p-4 shadow-soft md:grid-cols-3"><select name="studentId" className="rounded-md border border-line px-3 py-2 text-sm">{students.map(s=><option key={s.id} value={s.id}>{s.studentNumber} — {s.preferredName || s.legalName}</option>)}</select><select name="classId" className="rounded-md border border-line px-3 py-2 text-sm">{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button className="rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">Enroll / transfer</button></form> : null}
    <section className="overflow-hidden rounded-lg border border-line bg-white shadow-soft"><table className="min-w-full divide-y divide-line text-sm"><thead className="bg-rice"><tr>{["Student","Class","Status","Start","End"].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-moss">{h}</th>)}</tr></thead><tbody className="divide-y divide-line">{enrollments.map(e=><tr key={e.id}><td className="px-4 py-3 font-semibold text-ink">{e.student.studentNumber} — {e.student.preferredName || e.student.legalName}</td><td className="px-4 py-3 text-moss">{e.class.name}</td><td className="px-4 py-3 text-moss">{e.status}</td><td className="px-4 py-3 text-moss">{e.startDate.toISOString().slice(0,10)}</td><td className="px-4 py-3 text-moss">{e.endDate?.toISOString().slice(0,10) || "—"}</td></tr>)}</tbody></table></section>
  </div>;
}
