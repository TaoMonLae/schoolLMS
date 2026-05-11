import { PageHeader } from "@/components/page-header";
import { StudentForm } from "@/components/student-form";
import { canManageStudents } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { getClassOptionsForUser } from "@/lib/students";

export default async function NewStudentPage() {
  const currentUser = await getRequiredCurrentUser();
  const classOptions = await getClassOptionsForUser(currentUser);
  const canManage = canManageStudents(currentUser.role);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader eyebrow="Students" title="Add Student" description="Create a learner profile with guardian, emergency, and optional refugee document information." />
      {canManage ? (
        <StudentForm mode="create" currentRole={currentUser.role} classOptions={classOptions} />
      ) : (
        <div className="rounded-lg border border-line bg-white p-5 text-sm text-moss shadow-soft">You do not have permission to create student records.</div>
      )}
    </div>
  );
}
