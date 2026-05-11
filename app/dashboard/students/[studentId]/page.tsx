import { Edit, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StudentPhoto } from "@/components/student-photo";
import { StudentStatusBadge } from "@/components/student-status-badge";
import { canManageStudents, canViewSensitiveStudentDocuments } from "@/lib/rbac";
import { formatEnumLabel, getStudentForUser } from "@/lib/students";
import { getRequiredCurrentUser } from "@/lib/session";

type StudentProfilePageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

export default async function StudentProfilePage({ params }: StudentProfilePageProps) {
  const { studentId } = await params;
  const currentUser = await getRequiredCurrentUser();
  const student = await getStudentForUser(currentUser, studentId);

  if (!student) {
    notFound();
  }

  const canManage = canManageStudents(currentUser.role);
  const canViewDocuments = canViewSensitiveStudentDocuments(currentUser.role);

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-lg border border-hairline bg-canvas p-5 shadow-soft">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <StudentPhoto student={student} size="lg" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-orange">{student.studentNumber}</p>
              <h1 className="mt-1 text-2xl font-semibold text-ink sm:text-3xl">{student.preferredName || student.legalName}</h1>
              <p className="mt-2 text-sm text-slate">{student.legalName} | {student.className}</p>
              <div className="mt-3">
                <StudentStatusBadge status={student.status} />
              </div>
            </div>
          </div>
          {canManage ? (
            <Link href={`/dashboard/students/${student.id}/edit`} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-bold text-on-primary hover:bg-primary-pressed active:bg-primary-deep">
              <Edit className="h-4 w-4" aria-hidden="true" />
              Edit Student
            </Link>
          ) : null}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <ProfileCard title="Student Details">
          <ProfileItem label="Gender" value={formatEnumLabel(student.gender)} />
          <ProfileItem label="Date of birth" value={student.dateOfBirth} />
          <ProfileItem label="Primary language" value={student.primaryLanguage} />
          <ProfileItem label="Current class" value={student.className} />
        </ProfileCard>

        <ProfileCard title="Guardian Information">
          <ProfileItem label="Guardian" value={student.guardianName} />
          <ProfileItem label="Relationship" value={student.guardianRelationship} />
          <ProfileItem label="Phone" value={student.guardianPhone} />
          <ProfileItem label="Email" value={student.guardianEmail} />
          <ProfileItem label="Address" value={student.homeAddress} />
        </ProfileCard>

        <ProfileCard title="Emergency Contact">
          <ProfileItem label="Contact" value={student.emergencyContactName} />
          <ProfileItem label="Phone" value={student.emergencyContactPhone} />
          <ProfileItem label="Relationship" value={student.emergencyRelationship} />
        </ProfileCard>

        <ProfileCard title="Refugee Document Fields">
          {canViewDocuments ? (
            <>
              <ProfileItem label="UNHCR status" value={student.unhcrStatus} />
              <ProfileItem label="Document type" value={student.documentType ? formatEnumLabel(student.documentType) : undefined} />
              <ProfileItem label="Document number" value={student.documentNumber} />
              <ProfileItem label="Expiry date" value={student.documentExpiryDate} />
            </>
          ) : (
            <div className="flex gap-3 rounded-md border border-hairline bg-surface p-4 text-sm leading-6 text-slate">
              <LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-brand-orange" aria-hidden="true" />
              Sensitive document fields are hidden for your role.
            </div>
          )}
        </ProfileCard>
      </div>
    </div>
  );
}

function ProfileCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-hairline bg-canvas p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <dl className="mt-4 divide-y divide-line">{children}</dl>
    </section>
  );
}

function ProfileItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[160px_1fr]">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate">{label}</dt>
      <dd className="text-sm font-medium text-ink">{value || "Not recorded"}</dd>
    </div>
  );
}
