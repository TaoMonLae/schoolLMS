import { PageHeader } from "@/components/page-header";
import { createClass } from "@/app/dashboard/classes/actions";
import { db } from "@/lib/db";
import { canManageClasses } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { tenantFilter } from "@/lib/tenant";

export default async function NewClassPage() {
  const user = await getRequiredCurrentUser();
  if (!canManageClasses(user.role)) return <PageHeader eyebrow="Classes" title="Not authorized" description="You do not have permission to create classes." />;
  const schoolId = tenantFilter(user).schoolId;
  const teachers = await db.user.findMany({ where: { schoolId, role: "TEACHER", isActive: true }, orderBy: { name: "asc" } });
  return <div className="space-y-6 pb-10"><PageHeader eyebrow="Classes" title="Create Class" description="Create a DB-backed class and optionally assign a teacher." /><ClassForm action={createClass} teachers={teachers} /></div>;
}

function ClassForm({ action, teachers }: { action: (formData: FormData) => Promise<void>; teachers: { id: string; name: string }[] }) {
  return <form action={action} className="grid gap-4 rounded-lg border border-line bg-white p-5 shadow-soft sm:grid-cols-2">
    <Input name="name" label="Class name" required /><Input name="academicYear" label="Academic year" defaultValue={String(new Date().getFullYear())} required /><Input name="gradeLevel" label="Grade level" /><Input name="room" label="Room" />
    <label className="text-sm font-semibold text-ink">Teacher<select name="teacherId" className="mt-2 w-full rounded-md border border-line px-3 py-3 text-sm"><option value="">No teacher</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
    <div className="sm:col-span-2"><button className="rounded-md bg-ink px-5 py-3 text-sm font-bold text-white">Create Class</button></div>
  </form>;
}
function Input(props: { name: string; label: string; defaultValue?: string; required?: boolean }) { return <label className="text-sm font-semibold text-ink">{props.label}<input {...props} className="mt-2 w-full rounded-md border border-line px-3 py-3 text-sm" /></label>; }
