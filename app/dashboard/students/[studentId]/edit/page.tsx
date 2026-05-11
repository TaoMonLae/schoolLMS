import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StudentForm } from "@/components/student-form";
import { canManageStudents } from "@/lib/rbac";
import { demoCurrentUser, getStudentForUser } from "@/lib/students";

type EditStudentPageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

export default async function EditStudentPage({ params }: EditStudentPageProps) {
  const { studentId } = await params;
  const student = getStudentForUser(demoCurrentUser, studentId);

  if (!student) {
    notFound();
  }

  const canManage = canManageStudents(demoCurrentUser.role);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader eyebrow="Students" title={`Edit ${student.preferredName || student.legalName}`} description="Update learner, guardian, emergency, and authorized document fields." />
      {canManage ? (
        <StudentForm mode="edit" student={student} currentRole={demoCurrentUser.role} />
      ) : (
        <div className="rounded-lg border border-line bg-white p-5 text-sm text-moss shadow-soft">You do not have permission to edit student records.</div>
      )}
    </div>
  );
}
