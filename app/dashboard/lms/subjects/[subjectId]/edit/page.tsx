import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { updateSubject, deleteSubjectSafely } from "@/app/dashboard/lms/actions";
import { db } from "@/lib/db";
import { canManageLms } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { tenantFilter } from "@/lib/tenant";

export default async function EditSubjectPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = await params;
  const user = await getRequiredCurrentUser();
  if (!canManageLms(user.role)) redirect("/dashboard/lms");
  const schoolId = tenantFilter(user).schoolId;
  const subject = await db.subject.findFirst({ where: { id: subjectId, schoolId } });
  if (!subject) notFound();
  return <div className="space-y-6 pb-10"><PageHeader eyebrow="LMS" title="Edit Subject" description="Update a GED/custom subject." /><form action={updateSubject} className="grid gap-4 rounded-lg border border-hairline bg-canvas p-5 shadow-soft sm:grid-cols-2"><input type="hidden" name="id" value={subject.id} /><Input name="name" label="Name" defaultValue={subject.name} required /><Input name="code" label="Code" defaultValue={subject.code || ""} /><label className="flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" name="isGed" defaultChecked={subject.isGed} /> GED subject</label><label className="sm:col-span-2 text-sm font-semibold text-ink">Description<textarea name="description" defaultValue={subject.description || ""} rows={5} className="mt-2 w-full rounded-md border border-hairline px-3 py-3 text-sm" /></label><div className="sm:col-span-2"><button className="rounded-md bg-ink px-5 py-3 text-sm font-bold text-on-dark">Save Subject</button></div></form><form action={deleteSubjectSafely}><input type="hidden" name="id" value={subject.id} /><button className="rounded-md border border-error/45 px-4 py-2 text-sm font-bold text-error">Delete if unused</button></form></div>;
}
function Input({ name, label, defaultValue, required }: { name: string; label: string; defaultValue?: string; required?: boolean }) { return <label className="text-sm font-semibold text-ink">{label}<input name={name} defaultValue={defaultValue} required={required} className="mt-2 w-full rounded-md border border-hairline px-3 py-3 text-sm" /></label>; }
