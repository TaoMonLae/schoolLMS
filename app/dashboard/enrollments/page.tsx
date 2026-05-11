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
    {params?.success ? <div className="rounded-lg border border-success/30 bg-tint-mint p-4 text-sm font-semibold text-success">{params.success}</div> : null}
    {params?.error ? <div className="rounded-lg border border-error/30 bg-tint-rose p-4 text-sm font-semibold text-error">{params.error}</div> : null}
    {canManage ? <form action={enrollStudent} className="grid gap-3 rounded-lg border border-hairline bg-canvas p-4 shadow-soft md:grid-cols-3"><select name="studentId" className="rounded-md border border-hairline px-3 py-2 text-sm">{students.map(s=><option key={s.id} value={s.id}>{s.studentNumber} — {s.preferredName || s.legalName}</option>)}</select><select name="classId" className="rounded-md border border-hairline px-3 py-2 text-sm">{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button className="rounded-md bg-ink px-4 py-2 text-sm font-bold text-on-dark">Enroll / transfer</button></form> : null}
    <section className="overflow-hidden rounded-lg border border-hairline bg-canvas shadow-soft"><table className="min-w-full divide-y divide-line text-sm"><thead className="bg-surface"><tr>{["Student","Class","Status","Start","End"].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate">{h}</th>)}</tr></thead><tbody className="divide-y divide-line">{enrollments.map(e=><tr key={e.id}><td className="px-4 py-3 font-semibold text-ink">{e.student.studentNumber} — {e.student.preferredName || e.student.legalName}</td><td className="px-4 py-3 text-slate">{e.class.name}</td><td className="px-4 py-3 text-slate">{e.status}</td><td className="px-4 py-3 text-slate">{e.startDate.toISOString().slice(0,10)}</td><td className="px-4 py-3 text-slate">{e.endDate?.toISOString().slice(0,10) || "—"}</td></tr>)}</tbody></table></section>
  </div>;
}
