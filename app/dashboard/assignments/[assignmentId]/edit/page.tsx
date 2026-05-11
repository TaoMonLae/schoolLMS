import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { updateAssignment, deleteAssignment } from "@/app/dashboard/assignments/actions";
import { AssignmentForm } from "@/app/dashboard/assignments/new/page";
import { getAssignmentForUser, getVisibleClassesForLearning, getVisibleSubjects } from "@/lib/lms";
import { canManageGrades } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";

export default async function EditAssignmentPage({ params }: { params: Promise<{ assignmentId: string }> }) { const { assignmentId } = await params; const user = await getRequiredCurrentUser(); if (!canManageGrades(user.role)) redirect("/dashboard/assignments"); const [assignment, classes, subjects] = await Promise.all([getAssignmentForUser(user, assignmentId), getVisibleClassesForLearning(user), getVisibleSubjects(user)]); if (!assignment) notFound(); return <div className="space-y-6 pb-10"><PageHeader eyebrow="Assignments" title="Edit Assignment" description="Update assignment metadata, status, or delete it." /><AssignmentForm action={updateAssignment} classes={classes} subjects={subjects} assignment={assignment} /><form action={deleteAssignment}><input type="hidden" name="id" value={assignment.id} /><button className="rounded-md border border-[#8b2b20] px-4 py-2 text-sm font-bold text-[#8b2b20]">Delete Assignment</button></form></div>; }
