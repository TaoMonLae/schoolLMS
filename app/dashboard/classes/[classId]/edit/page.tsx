import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { updateClass } from "@/app/dashboard/classes/actions";
import { db } from "@/lib/db";
import { canManageClasses } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { tenantFilter } from "@/lib/tenant";

export default async function EditClassPage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams?: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const { classId } = await params; const user = await getRequiredCurrentUser(); if (!canManageClasses(user.role)) redirect("/dashboard/classes"); const schoolId = tenantFilter(user).schoolId;
  const [klass, teachers] = await Promise.all([db.class.findFirst({ where: { id: classId, schoolId } }), db.user.findMany({ where: { schoolId, role: "TEACHER", isActive: true }, orderBy: { name: "asc" } })]);
  if (!klass) notFound();
  return <div className="space-y-6 pb-10"><PageHeader eyebrow="Classes" title="Edit Class" description="Update class details and teacher assignment." />{query?.error ? <div className="rounded-lg border border-[#efb4a9] bg-[#fff1ee] p-4 text-sm font-semibold text-[#8a3b2d]">{query.error}</div> : null}<form action={updateClass} className="grid gap-4 rounded-lg border border-line bg-white p-5 shadow-soft sm:grid-cols-2"><input type="hidden" name="id" value={klass.id} /><Input name="name" label="Class name" defaultValue={klass.name} required /><Input name="academicYear" label="Academic year" defaultValue={klass.academicYear} required /><Input name="gradeLevel" label="Grade level" defaultValue={klass.gradeLevel || ""} /><Input name="room" label="Room" defaultValue={klass.room || ""} /><label className="text-sm font-semibold text-ink">Teacher<select name="teacherId" defaultValue={klass.teacherId || ""} className="mt-2 w-full rounded-md border border-line px-3 py-3 text-sm"><option value="">No teacher</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label><div className="sm:col-span-2"><button className="rounded-md bg-ink px-5 py-3 text-sm font-bold text-white">Save Class</button></div></form></div>;
}
function Input(props: { name: string; label: string; defaultValue?: string; required?: boolean }) { return <label className="text-sm font-semibold text-ink">{props.label}<input {...props} className="mt-2 w-full rounded-md border border-line px-3 py-3 text-sm" /></label>; }
