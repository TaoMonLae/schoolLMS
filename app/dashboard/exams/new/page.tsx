import { PageHeader } from "@/components/page-header";
import { createExam } from "@/app/dashboard/exams/actions";
import { ExamBuilder } from "@/app/dashboard/exams/exam-builder";
import { getVisibleClassesForLearning, getVisibleSubjects } from "@/lib/lms";
import { canManageGrades } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NewExamPage() {
  const user = await getRequiredCurrentUser();
  if (!canManageGrades(user.role)) return <PageHeader eyebrow="Exams" title="Not authorized" description="You cannot create exams." />;
  const [classes, subjects] = await Promise.all([getVisibleClassesForLearning(user), getVisibleSubjects(user)]);
  return <div className="space-y-6 pb-10"><ExamBuilder action={createExam} classes={classes} subjects={subjects} /></div>;
}
