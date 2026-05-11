import Link from "next/link";
import { AlertTriangle, Bell, HeartHandshake, LockKeyhole, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { deleteCaseNote, deleteSponsorSupport, resolveDocumentReminder, updateDocumentReminder, updateCaseNote, updateReferral, updateSponsorSupport } from "@/app/dashboard/support/actions";
import { StudentPhoto } from "@/components/student-photo";
import { canManageSupport } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { formatEnumLabel } from "@/lib/students";
import { AppUser, StudentRecord } from "@/lib/types";
import {
  canAddBasicSupport,
  canAddSensitiveSupport,
  canViewSensitiveSupport,
  getDocumentRemindersForUser,
  getReferralsForStudent,
  getSensitiveAuditPreview,
  getSponsorSupportsForStudent,
  getSupportStudentForUser,
  getSupportStudentsForUser,
  getVisibleCaseNotesForStudent
} from "@/lib/support";

type SupportPageProps = {
  searchParams?: Promise<{ studentId?: string; saved?: string; error?: string }>;
};

export default async function SupportPage({ searchParams }: SupportPageProps) {
  const params = await searchParams;
  const currentUser = await getRequiredCurrentUser();
  const students = await getSupportStudentsForUser(currentUser);
  const selectedStudent = params?.studentId ? await getSupportStudentForUser(currentUser, params.studentId) : students[0];
  const reminders = await getDocumentRemindersForUser(currentUser);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Refugee Support"
        title="Case Support"
        description="Restricted case notes, family context, sponsor support, referrals, document reminders, and emergency contacts."
      />

      {params?.saved ? <div className="rounded-lg border border-[#b9dfac] bg-[#e8f3dc] p-4 text-sm font-semibold text-[#315933]">{params.saved}</div> : null}
      {params?.error ? <div className="rounded-lg border border-[#efb4a9] bg-[#fff1ee] p-4 text-sm font-semibold text-[#8a3b2d]">{params.error}</div> : null}

      <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Students</h2>
          <form className="mt-4">
            <select name="studentId" defaultValue={selectedStudent?.id} className="h-11 w-full rounded-md border border-line bg-rice px-3 text-sm text-ink">
              {students.length === 0 ? <option value="">No visible students</option> : null}
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.preferredName || student.legalName} | {student.className}
                </option>
              ))}
            </select>
            <button className="mt-3 w-full rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">Open Student</button>
          </form>
          <div className="mt-5 rounded-md border border-line bg-rice p-4">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-1 h-4 w-4 text-clay" />
              <p className="text-xs leading-5 text-moss">
                Sensitive notes are visible only to school admins, super admins, and approved case managers. Audit logs store metadata only.
              </p>
            </div>
          </div>
        </aside>

        {selectedStudent ? <StudentSupportPanel user={currentUser} student={selectedStudent} /> : <div className="rounded-lg border border-line bg-white p-8 text-center text-sm text-moss shadow-soft">No visible students are available for your role.</div>}
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-clay" />
          <h2 className="text-lg font-semibold text-ink">Document Expiry Reminders</h2>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="rounded-md border border-line bg-rice p-4">
              <p className="text-sm font-semibold text-ink">{reminder.documentType}</p>
              <p className="mt-1 text-xs text-moss">Reminder: {reminder.reminderDate} | Expiry: {reminder.expiryDate}</p>
              <p className="mt-2 text-xs font-semibold text-clay">{reminder.resolved ? "Resolved" : "Open"}</p>
              {canManageSupport(currentUser.role) ? <details className="mt-3 rounded-md bg-white p-3"><summary className="cursor-pointer text-xs font-bold text-clay">Edit / resolve reminder</summary><form action={updateDocumentReminder} className="mt-3 grid gap-2"><input type="hidden" name="id" value={reminder.id} /><input type="hidden" name="studentId" value={reminder.studentId} /><input name="documentType" defaultValue={reminder.documentType} className="rounded-md border border-line px-3 py-2 text-sm" /><input name="documentRef" defaultValue={reminder.documentRef} className="rounded-md border border-line px-3 py-2 text-sm" /><input type="date" name="expiryDate" defaultValue={reminder.expiryDate} className="rounded-md border border-line px-3 py-2 text-sm" /><input type="date" name="reminderDate" defaultValue={reminder.reminderDate} className="rounded-md border border-line px-3 py-2 text-sm" /><label className="text-xs font-semibold text-moss"><input type="checkbox" name="resolved" defaultChecked={reminder.resolved} /> Resolved</label><button className="rounded-md bg-ink px-3 py-2 text-xs font-bold text-white">Update reminder</button></form>{!reminder.resolved ? <form action={resolveDocumentReminder} className="mt-2"><input type="hidden" name="id" value={reminder.id} /><input type="hidden" name="studentId" value={reminder.studentId} /><button className="text-xs font-bold text-clay">Mark resolved</button></form> : null}</details> : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

async function StudentSupportPanel({ user, student }: { user: AppUser; student: StudentRecord }) {
  const [notes, sponsorSupports, referrals, auditPreview] = await Promise.all([
    getVisibleCaseNotesForStudent(user, student.id),
    getSponsorSupportsForStudent(user, student.id),
    getReferralsForStudent(user, student.id),
    getSensitiveAuditPreview(user, student.id)
  ]);
  const canAddBasic = canAddBasicSupport(user, student);
  const canAddSensitive = canAddSensitiveSupport(user);
  const canSeeSensitive = canViewSensitiveSupport(user);

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <StudentPhoto student={student} size="lg" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-clay">{student.studentNumber}</p>
              <h2 className="text-2xl font-semibold text-ink">{student.preferredName || student.legalName}</h2>
              <p className="mt-1 text-sm text-moss">{student.className}</p>
            </div>
          </div>
          {(canManageSupport(user.role) || canAddBasic) ? (
            <Link href={`/dashboard/support/new?studentId=${student.id}`} className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-bold text-white">
              <Plus className="h-4 w-4" />
              Add Support Record
            </Link>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-ink">Case Notes</h2>
          <p className="text-xs font-semibold text-moss">
            {canAddSensitive ? "Can add basic and sensitive notes" : canAddBasic ? "Can add basic notes only" : "View only"}
          </p>
        </div>
        <div className="mt-4 space-y-3">
          {notes.map((note) => (
            <article key={note.id} className={`rounded-md border p-4 ${note.redacted ? "border-[#f0d38a] bg-[#fff2d4]" : "border-line bg-rice"}`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-ink">{note.title}</p>
                  <p className="mt-1 text-xs text-moss">{note.authorName} | {note.createdAt} | {formatEnumLabel(note.sensitivity)}</p>
                </div>
                {note.redacted ? <LockKeyhole className="h-4 w-4 text-clay" /> : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-moss">
                {note.redacted ? "Sensitive note hidden. Request access from a school admin or approved case manager." : note.note}
              </p>
              {!note.redacted && (note.sensitivity === "BASIC" ? canAddBasic : canAddSensitive) ? (
                <details className="mt-3 rounded-md border border-line bg-white p-3">
                  <summary className="cursor-pointer text-xs font-bold text-clay">Edit / delete note</summary>
                  <form action={updateCaseNote} className="mt-3 grid gap-2">
                    <input type="hidden" name="id" value={note.id} /><input type="hidden" name="studentId" value={student.id} />
                    <input name="title" defaultValue={note.title} className="rounded-md border border-line px-3 py-2 text-sm" />
                    <textarea name="note" defaultValue={note.note || ""} className="min-h-20 rounded-md border border-line px-3 py-2 text-sm" />
                    <select name="sensitivity" defaultValue={note.sensitivity} className="rounded-md border border-line px-3 py-2 text-sm"><option value="BASIC">Basic</option>{canAddSensitive ? <option value="SENSITIVE">Sensitive</option> : null}</select>
                    <button className="rounded-md bg-ink px-3 py-2 text-xs font-bold text-white">Update note</button>
                  </form>
                  <form action={deleteCaseNote} className="mt-2"><input type="hidden" name="id" value={note.id} /><input type="hidden" name="studentId" value={student.id} /><button className="text-xs font-bold text-[#8a3b2d]">Delete note</button></form>
                </details>
              ) : null}
            </article>
          ))}
          {notes.length === 0 ? <div className="rounded-md border border-line bg-rice p-4 text-sm text-moss">No case notes recorded for this student.</div> : null}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Guardian and Family Situation</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Info label="Guardian" value={`${student.guardianName || "Not recorded"} (${student.guardianRelationship || "relationship not recorded"})`} />
            <Info label="Phone" value={student.guardianPhone || "Not recorded"} />
            <Info label="Home address" value={student.homeAddress || "Not recorded"} />
            <Info label="Sensitive visibility" value={canSeeSensitive ? "Sensitive notes visible for this role" : "Sensitive notes hidden for this role"} />
          </dl>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-clay" />
            <h2 className="text-lg font-semibold text-ink">Emergency Contact</h2>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <Info label="Name" value={student.emergencyContactName || "Not recorded"} />
            <Info label="Phone" value={student.emergencyContactPhone || "Not recorded"} />
            <Info label="Relationship" value={student.emergencyRelationship || "Not recorded"} />
          </dl>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <HeartHandshake className="h-5 w-5 text-clay" />
            <h2 className="text-lg font-semibold text-ink">Sponsor Support</h2>
          </div>
          <div className="mt-4 space-y-3">
            {sponsorSupports.map((support) => (
              <div key={support.id} className="rounded-md border border-line bg-rice p-4">
                <p className="text-sm font-semibold text-ink">{support.sponsorName}</p>
                <p className="mt-1 text-xs text-moss">{support.supportType} | {support.currency} {support.amount}</p>
                <p className="mt-2 text-xs font-semibold text-clay">{formatEnumLabel(support.status)}</p>
                {canManageSupport(user.role) ? <details className="mt-3 rounded-md bg-white p-3"><summary className="cursor-pointer text-xs font-bold text-clay">Edit / delete sponsor support</summary><form action={updateSponsorSupport} className="mt-3 grid gap-2"><input type="hidden" name="id" value={support.id} /><input type="hidden" name="studentId" value={student.id} /><input name="sponsorName" defaultValue={support.sponsorName} className="rounded-md border border-line px-3 py-2 text-sm" /><input name="supportType" defaultValue={support.supportType} className="rounded-md border border-line px-3 py-2 text-sm" /><input name="amount" defaultValue={support.amount} className="rounded-md border border-line px-3 py-2 text-sm" /><input name="currency" defaultValue={support.currency} className="rounded-md border border-line px-3 py-2 text-sm" /><select name="status" defaultValue={support.status} className="rounded-md border border-line px-3 py-2 text-sm"><option>ACTIVE</option><option>PAUSED</option><option>ENDED</option></select><input type="date" name="startDate" defaultValue={support.startDate} className="rounded-md border border-line px-3 py-2 text-sm" /><input type="date" name="endDate" defaultValue={support.endDate} className="rounded-md border border-line px-3 py-2 text-sm" /><textarea name="notes" defaultValue={support.notes || ""} className="rounded-md border border-line px-3 py-2 text-sm" /><button className="rounded-md bg-ink px-3 py-2 text-xs font-bold text-white">Update sponsor support</button></form><form action={deleteSponsorSupport} className="mt-2"><input type="hidden" name="id" value={support.id} /><input type="hidden" name="studentId" value={student.id} /><button className="text-xs font-bold text-[#8a3b2d]">Delete sponsor support</button></form></details> : null}
              </div>
            ))}
            {sponsorSupports.length === 0 ? <div className="rounded-md border border-line bg-rice p-4 text-sm text-moss">No sponsor support records.</div> : null}
          </div>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Referral Tracking</h2>
          <div className="mt-4 space-y-3">
            {referrals.map((referral) => (
              <div key={referral.id} className="rounded-md border border-line bg-rice p-4">
                <p className="text-sm font-semibold text-ink">{referral.agency}</p>
                <p className="mt-1 text-xs text-moss">{referral.reason} | Referred {referral.referredAt}</p>
                <p className="mt-2 text-xs font-semibold text-clay">{formatEnumLabel(referral.status)}</p>
                {canManageSupport(user.role) ? <details className="mt-3 rounded-md bg-white p-3"><summary className="cursor-pointer text-xs font-bold text-clay">Edit / resolve referral</summary><form action={updateReferral} className="mt-3 grid gap-2"><input type="hidden" name="id" value={referral.id} /><input type="hidden" name="studentId" value={student.id} /><input name="agency" defaultValue={referral.agency} className="rounded-md border border-line px-3 py-2 text-sm" /><input name="reason" defaultValue={referral.reason} className="rounded-md border border-line px-3 py-2 text-sm" /><select name="status" defaultValue={referral.status} className="rounded-md border border-line px-3 py-2 text-sm"><option>OPEN</option><option>IN_PROGRESS</option><option>RESOLVED</option><option>CLOSED</option></select><input type="date" name="referredAt" defaultValue={referral.referredAt} className="rounded-md border border-line px-3 py-2 text-sm" /><input type="date" name="resolvedAt" defaultValue={referral.resolvedAt} className="rounded-md border border-line px-3 py-2 text-sm" /><textarea name="notes" defaultValue={referral.notes || ""} className="rounded-md border border-line px-3 py-2 text-sm" /><button className="rounded-md bg-ink px-3 py-2 text-xs font-bold text-white">Update referral</button></form></details> : null}
              </div>
            ))}
            {referrals.length === 0 ? <div className="rounded-md border border-line bg-rice p-4 text-sm text-moss">No referrals recorded.</div> : null}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Sensitive Access Audit Preview</h2>
        <p className="mt-2 text-sm leading-6 text-moss">Audit logs record actor, action, resource, and metadata. Sensitive note content is never logged.</p>
        <div className="mt-4 space-y-2">
          {auditPreview.map((event) => (
            <div key={`${event.resourceId}-${event.action}`} className="rounded-md bg-rice p-3 text-xs text-moss">
              {event.action} | {event.resourceType}:{event.resourceId} | contentLogged={String(event.metadata.contentLogged)}
            </div>
          ))}
          {auditPreview.length === 0 ? <div className="rounded-md border border-line bg-rice p-4 text-sm text-moss">No sensitive audit events for this student.</div> : null}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-moss">{label}</dt>
      <dd className="mt-1 font-medium text-ink">{value}</dd>
    </div>
  );
}
