import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StudentForm } from "@/components/student-form";
import { canManageStudents } from "@/lib/rbac";
import { getClassOptionsForUser, getStudentForUser } from "@/lib/students";
import { getRequiredCurrentUser } from "@/lib/session";

type EditStudentPageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

export default async function EditStudentPage({ params }: EditStudentPageProps) {
  const { studentId } = await params;
  const currentUser = await getRequiredCurrentUser();
  const student = await getStudentForUser(currentUser, studentId);
  const classOptions = await getClassOptionsForUser(currentUser);

  if (!student) {
    notFound();
  }

  const canManage = canManageStudents(currentUser.role);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader eyebrow="Students" title={`Edit ${student.preferredName || student.legalName}`} description="Update learner, guardian, emergency, and authorized document fields." />
      {canManage ? (
        <StudentForm mode="edit" student={student} currentRole={currentUser.role} classOptions={classOptions} />
      ) : (
        <div className="rounded-lg border border-line bg-white p-5 text-sm text-moss shadow-soft">You do not have permission to edit student records.</div>
      )}
    </div>
  );
}
