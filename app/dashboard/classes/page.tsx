import { PageHeader } from "@/components/page-header";
import { createClass } from "@/app/dashboard/classes/actions";
import { db } from "@/lib/db";
import { canManageClasses } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { tenantFilter } from "@/lib/tenant";

export default async function ClassesPage() {
  const user = await getRequiredCurrentUser();
  const schoolFilter = tenantFilter(user);
  const [classes, teachers] = await Promise.all([
    db.class.findMany({ where: { ...schoolFilter, ...(user.role === "TEACHER" ? { id: { in: user.assignedClassIds } } : {}) }, include: { teacher: true, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } }, orderBy: [{ academicYear: "desc" }, { name: "asc" }] }),
    db.user.findMany({ where: { ...schoolFilter, role: "TEACHER", isActive: true }, orderBy: { name: "asc" } })
  ]);
  const canManage = canManageClasses(user.role);

  return <div className="space-y-6 pb-10">
    <PageHeader eyebrow="Classes" title="Class Management" description="Organize classes by school, teacher, room, academic year, and grade level." />
    {canManage ? <form action={createClass} className="grid gap-3 rounded-lg border border-line bg-white p-4 shadow-soft md:grid-cols-6">
      <input name="name" required placeholder="Class name" className="rounded-md border border-line px-3 py-2 text-sm" />
      <input name="academicYear" required defaultValue={new Date().getFullYear()} className="rounded-md border border-line px-3 py-2 text-sm" />
      <input name="gradeLevel" placeholder="Grade level" className="rounded-md border border-line px-3 py-2 text-sm" />
      <input name="room" placeholder="Room" className="rounded-md border border-line px-3 py-2 text-sm" />
      <select name="teacherId" className="rounded-md border border-line px-3 py-2 text-sm"><option value="">No teacher</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
      <button className="rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">Create class</button>
    </form> : null}
    <section className="overflow-hidden rounded-lg border border-line bg-white shadow-soft"><table className="min-w-full divide-y divide-line text-sm"><thead className="bg-rice"><tr>{["Class","Teacher","Year","Room","Active enrollments"].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-moss">{h}</th>)}</tr></thead><tbody className="divide-y divide-line">{classes.map(c=><tr key={c.id}><td className="px-4 py-3 font-semibold text-ink">{c.name}</td><td className="px-4 py-3 text-moss">{c.teacher?.name || "Unassigned"}</td><td className="px-4 py-3 text-moss">{c.academicYear}</td><td className="px-4 py-3 text-moss">{c.room || "—"}</td><td className="px-4 py-3 text-moss">{c._count.enrollments}</td></tr>)}</tbody></table></section>
  </div>;
}
