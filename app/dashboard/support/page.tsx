import { AlertTriangle, Bell, HeartHandshake, LockKeyhole, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StudentPhoto } from "@/components/student-photo";
import { canManageSupport } from "@/lib/rbac";
import { demoCurrentUser, formatEnumLabel } from "@/lib/students";
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
  searchParams?: Promise<{ studentId?: string }>;
};

export default async function SupportPage({ searchParams }: SupportPageProps) {
  const params = await searchParams;
  const students = getSupportStudentsForUser(demoCurrentUser);
  const selectedStudent = getSupportStudentForUser(demoCurrentUser, params?.studentId || students[0]?.id || "");
  const reminders = getDocumentRemindersForUser(demoCurrentUser);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Refugee Support"
        title="Case Support"
        description="Restricted case notes, family context, sponsor support, referrals, document reminders, and emergency contacts."
      />

      <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Students</h2>
          <form className="mt-4">
            <select name="studentId" defaultValue={selectedStudent?.id} className="h-11 w-full rounded-md border border-line bg-rice px-3 text-sm text-ink">
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

        {selectedStudent ? <StudentSupportPanel student={selectedStudent} /> : null}
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
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StudentSupportPanel({ student }: { student: ReturnType<typeof getSupportStudentsForUser>[number] }) {
  const notes = getVisibleCaseNotesForStudent(demoCurrentUser, student.id);
  const sponsorSupports = getSponsorSupportsForStudent(demoCurrentUser, student.id);
  const referrals = getReferralsForStudent(demoCurrentUser, student.id);
  const auditPreview = getSensitiveAuditPreview(demoCurrentUser, student.id);
  const canAddBasic = canAddBasicSupport(demoCurrentUser, student);
  const canAddSensitive = canAddSensitiveSupport(demoCurrentUser);
  const canSeeSensitive = canViewSensitiveSupport(demoCurrentUser);

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
          {canManageSupport(demoCurrentUser.role) ? (
            <button className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-bold text-white">
              <Plus className="h-4 w-4" />
              Add Support Record
            </button>
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
            </article>
          ))}
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
              </div>
            ))}
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
              </div>
            ))}
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
