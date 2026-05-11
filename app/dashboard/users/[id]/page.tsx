import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { RoleBadge } from "@/components/role-badge";
import { resetPasswordAction, setUserActiveAction } from "@/app/dashboard/users/actions";
import { getRequiredCurrentUser } from "@/lib/session";
import { canAccessUserManagement, getManagedUser } from "@/lib/users";

type UserDetailProps = { params: Promise<{ id: string }>; searchParams?: Promise<{ saved?: string; error?: string }> };
export default async function UserDetailPage({ params, searchParams }: UserDetailProps) {
  const { id } = await params;
  const qs = await searchParams;
  const actor = await getRequiredCurrentUser();
  if (!canAccessUserManagement(actor)) redirect("/dashboard");
  const user = await getManagedUser(actor, id);
  if (!user) notFound();
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><PageHeader eyebrow="Users & Access" title={user.name} description={user.email} /><Link href={`/dashboard/users/${user.id}/edit`} className="rounded-md bg-primary px-4 py-3 text-sm font-bold text-on-primary hover:bg-primary-pressed active:bg-primary-deep">Edit User</Link></div>
      {qs?.saved ? <div className="rounded-lg border border-success/30 bg-tint-mint p-4 text-sm font-semibold text-success">User change saved.</div> : null}
      {qs?.error === "password" ? <div className="rounded-lg border border-error/30 bg-tint-rose p-4 text-sm font-semibold text-error">Temporary password must be at least 8 characters.</div> : null}
      <section className="grid gap-4 md:grid-cols-4"><Card label="Role" value={<RoleBadge role={user.role} />} /><Card label="School" value={user.schoolName || "Platform"} /><Card label="Status" value={user.isActive ? "Active" : "Inactive"} /><Card label="Student link" value={user.studentName || "None"} /></section>
      <section className="grid gap-5 lg:grid-cols-2">
        <form action={resetPasswordAction} className="rounded-lg border border-hairline bg-canvas p-5 shadow-soft"><input type="hidden" name="id" value={user.id} /><h2 className="text-lg font-semibold text-ink">Reset Password</h2><input name="password" type="password" placeholder="Temporary password" className="mt-4 w-full rounded-md border border-hairline bg-canvas px-3 py-3 text-sm text-ink" /><button className="mt-4 rounded-md bg-primary px-4 py-3 text-sm font-bold text-on-primary">Set Temporary Password</button></form>
        <form action={setUserActiveAction} className="rounded-lg border border-hairline bg-canvas p-5 shadow-soft"><input type="hidden" name="id" value={user.id} /><input type="hidden" name="isActive" value={user.isActive ? "false" : "true"} /><h2 className="text-lg font-semibold text-ink">Deactivate / Reactivate</h2><p className="mt-2 text-sm text-slate">Inactive users cannot resolve an active session through the database-backed session guard.</p><button className="mt-4 rounded-md border border-hairline px-4 py-3 text-sm font-bold text-ink hover:bg-surface">{user.isActive ? "Deactivate" : "Reactivate"}</button></form>
      </section>
    </div>
  );
}
function Card({ label, value }: { label: string; value: React.ReactNode }) { return <div className="rounded-lg border border-hairline bg-canvas p-4 shadow-soft"><p className="text-xs font-semibold uppercase text-slate">{label}</p><div className="mt-2 text-sm font-semibold text-ink">{value}</div></div>; }
