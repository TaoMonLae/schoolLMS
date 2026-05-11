import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { createUserAction } from "@/app/dashboard/users/actions";
import { UserForm } from "@/app/dashboard/users/user-form";
import { getRequiredCurrentUser } from "@/lib/session";
import { canAccessUserManagement, getUserManagementOptions } from "@/lib/users";

type NewUserPageProps = { searchParams?: Promise<{ error?: string; schoolId?: string }> };

export default async function NewUserPage({ searchParams }: NewUserPageProps) {
  const params = await searchParams;
  const actor = await getRequiredCurrentUser();
  if (!canAccessUserManagement(actor)) redirect("/dashboard");
  const options = await getUserManagementOptions(actor, params?.schoolId);
  return <div className="space-y-6 pb-10"><PageHeader eyebrow="Users & Access" title="Create User" description="Create a school-scoped account with a real bcrypt-hashed password." /><UserForm action={createUserAction} options={options} error={params?.error} /></div>;
}
