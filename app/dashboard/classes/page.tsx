import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";
import { canManageClasses } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { tenantFilter } from "@/lib/tenant";

type ClassesPageProps = { searchParams?: Promise<{ saved?: string; error?: string }> };

export default async function ClassesPage({ searchParams }: ClassesPageProps) {
  const params = await searchParams;
  const user = await getRequiredCurrentUser();
  const schoolFilter = tenantFilter(user);
  const classes = await db.class.findMany({
    where: { ...schoolFilter, ...(user.role === "TEACHER" ? { id: { in: user.assignedClassIds } } : {}) },
    include: { teacher: true, _count: { select: { enrollments: { where: { status: "ACTIVE" } }, lessons: true, assignments: true, exams: true } } },
    orderBy: [{ academicYear: "desc" }, { name: "asc" }]
  });
  const canManage = canManageClasses(user.role);

  return <div className="space-y-6 pb-10">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <PageHeader eyebrow="Classes" title="Class Management" description="Organize classes by school, teacher, room, academic year, and grade level." />
      {canManage ? <Link href="/dashboard/classes/new" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-bold text-on-primary hover:bg-primary-pressed active:bg-primary-deep"><Plus className="h-4 w-4" />Create Class</Link> : null}
    </div>
    {params?.saved ? <div className="rounded-lg border border-success/30 bg-tint-mint p-4 text-sm font-semibold text-success">Class changes saved.</div> : null}
    {params?.error ? <div className="rounded-lg border border-error/30 bg-tint-rose p-4 text-sm font-semibold text-error">{params.error}</div> : null}
    <section className="overflow-hidden rounded-lg border border-hairline bg-canvas shadow-soft">
      <table className="min-w-full divide-y divide-line text-sm">
        <thead className="bg-surface"><tr>{["Class","Teacher","Year","Room","Active enrollments","Actions"].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{classes.map(c=><tr key={c.id}>
          <td className="px-4 py-3"><p className="font-semibold text-ink">{c.name}</p><p className="text-xs text-slate">{c._count.lessons} lessons · {c._count.assignments} assignments · {c._count.exams} exams</p></td>
          <td className="px-4 py-3 text-slate">{c.teacher?.name || "Unassigned"}</td><td className="px-4 py-3 text-slate">{c.academicYear}</td><td className="px-4 py-3 text-slate">{c.room || "—"}</td><td className="px-4 py-3 text-slate">{c._count.enrollments}</td>
          <td className="px-4 py-3"><div className="flex flex-wrap gap-2"><Link className="font-semibold text-brand-orange hover:text-ink" href={`/dashboard/classes/${c.id}`}>View</Link>{canManage ? <Link className="font-semibold text-brand-orange hover:text-ink" href={`/dashboard/classes/${c.id}/edit`}>Edit</Link> : null}<Link className="font-semibold text-brand-orange hover:text-ink" href={`/dashboard/enrollments?classId=${c.id}`}>Manage roster</Link></div></td>
        </tr>)}</tbody>
      </table>
      {classes.length === 0 ? <div className="p-8 text-center text-sm text-slate">No real classes exist for your current school scope.</div> : null}
    </section>
  </div>;
}
