import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { updateUserAction } from "@/app/dashboard/users/actions";
import { UserForm } from "@/app/dashboard/users/user-form";
import { getRequiredCurrentUser } from "@/lib/session";
import { canAccessUserManagement, getManagedUser, getUserManagementOptions } from "@/lib/users";

type EditUserPageProps = { params: Promise<{ id: string }>; searchParams?: Promise<{ error?: string }> };
export default async function EditUserPage({ params, searchParams }: EditUserPageProps) {
  const { id } = await params;
  const qs = await searchParams;
  const actor = await getRequiredCurrentUser();
  if (!canAccessUserManagement(actor)) redirect("/dashboard");
  const user = await getManagedUser(actor, id);
  if (!user) notFound();
  const options = await getUserManagementOptions(actor, user.schoolId);
  return <div className="space-y-6 pb-10"><PageHeader eyebrow="Users & Access" title={`Edit ${user.name}`} description="Update user access, class assignments, student links, and active status." /><UserForm action={updateUserAction} user={user} options={options} error={qs?.error} /></div>;
}
