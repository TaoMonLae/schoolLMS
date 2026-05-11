import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { createCaseNote, createDocumentReminder, createReferral, createSponsorSupport } from "@/app/dashboard/support/actions";
import { canManageSupport } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { canAddBasicSupport, canAddSensitiveSupport, getSupportStudentForUser } from "@/lib/support";

export default async function NewSupportRecordPage({ searchParams }: { searchParams?: Promise<{ studentId?: string }> }) {
  const params = await searchParams;
  const user = await getRequiredCurrentUser();
  const student = params?.studentId ? await getSupportStudentForUser(user, params.studentId) : null;
  if (!student) return <PageHeader eyebrow="Refugee Support" title="Student not found" description="Choose a visible student before adding support records." />;
  const canBasic = canAddBasicSupport(user, student);
  const canSensitive = canAddSensitiveSupport(user);
  const canManage = canManageSupport(user.role);

  return <div className="space-y-6 pb-10">
    <PageHeader eyebrow="Refugee Support" title={`Add support record for ${student.preferredName || student.legalName}`} description="Create case notes, sponsor support, referrals, and document reminders that persist after refresh." />
    <Link href={`/dashboard/support?studentId=${student.id}`} className="text-sm font-semibold text-clay hover:text-ink">← Back to support profile</Link>
    {(canBasic || canSensitive) ? <section className="rounded-lg border border-line bg-white p-5 shadow-soft"><h2 className="text-lg font-semibold text-ink">Case note</h2><form action={createCaseNote} className="mt-4 grid gap-3"><input type="hidden" name="studentId" value={student.id} /><Input name="title" label="Title" required /><Textarea name="note" label="Note" required /><label className="text-sm font-semibold text-ink">Sensitivity<select name="sensitivity" className="mt-2 w-full rounded-md border border-line px-3 py-3 text-sm"><option value="BASIC">Basic</option>{canSensitive ? <option value="SENSITIVE">Sensitive</option> : null}</select></label><button className="rounded-md bg-ink px-4 py-3 text-sm font-bold text-white">Save case note</button></form></section> : null}
    {canManage ? <section className="grid gap-5 lg:grid-cols-3">
      <form action={createSponsorSupport} className="rounded-lg border border-line bg-white p-5 shadow-soft"><input type="hidden" name="studentId" value={student.id} /><h2 className="text-lg font-semibold text-ink">Sponsor support</h2><Input name="sponsorName" label="Sponsor" required /><Input name="supportType" label="Support type" required /><Input name="amount" label="Amount" /><Input name="currency" label="Currency" defaultValue="USD" /><Select name="status" label="Status" options={["ACTIVE","PAUSED","ENDED"]} /><Input name="startDate" label="Start date" type="date" /><Input name="endDate" label="End date" type="date" /><Textarea name="notes" label="Notes" /><button className="mt-3 rounded-md bg-ink px-4 py-3 text-sm font-bold text-white">Save sponsor support</button></form>
      <form action={createReferral} className="rounded-lg border border-line bg-white p-5 shadow-soft"><input type="hidden" name="studentId" value={student.id} /><h2 className="text-lg font-semibold text-ink">Referral</h2><Input name="agency" label="Agency" required /><Input name="reason" label="Reason" required /><Select name="status" label="Status" options={["OPEN","IN_PROGRESS","RESOLVED","CLOSED"]} /><Input name="referredAt" label="Referred date" type="date" /><Input name="resolvedAt" label="Resolved date" type="date" /><Textarea name="notes" label="Notes" /><button className="mt-3 rounded-md bg-ink px-4 py-3 text-sm font-bold text-white">Save referral</button></form>
      <form action={createDocumentReminder} className="rounded-lg border border-line bg-white p-5 shadow-soft"><input type="hidden" name="studentId" value={student.id} /><h2 className="text-lg font-semibold text-ink">Document reminder</h2><Input name="documentType" label="Document type" required /><Input name="documentRef" label="Document reference" /><Input name="expiryDate" label="Expiry date" type="date" required /><Input name="reminderDate" label="Reminder date" type="date" required /><button className="mt-3 rounded-md bg-ink px-4 py-3 text-sm font-bold text-white">Save reminder</button></form>
    </section> : null}
  </div>;
}

function Input(props: { name: string; label: string; required?: boolean; defaultValue?: string; type?: string }) { return <label className="mt-3 block text-sm font-semibold text-ink">{props.label}<input {...props} className="mt-2 w-full rounded-md border border-line px-3 py-3 text-sm" /></label>; }
function Textarea(props: { name: string; label: string; required?: boolean }) { return <label className="mt-3 block text-sm font-semibold text-ink">{props.label}<textarea {...props} className="mt-2 min-h-24 w-full rounded-md border border-line px-3 py-3 text-sm" /></label>; }
function Select({ name, label, options }: { name: string; label: string; options: string[] }) { return <label className="mt-3 block text-sm font-semibold text-ink">{label}<select name={name} className="mt-2 w-full rounded-md border border-line px-3 py-3 text-sm">{options.map(option => <option key={option} value={option}>{option}</option>)}</select></label>; }
