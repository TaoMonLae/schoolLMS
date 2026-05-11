import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { RoleBadge } from "@/components/role-badge";
import { getRequiredCurrentUser } from "@/lib/session";
import { roles } from "@/lib/types";
import { canAccessUserManagement, getManagedUsers } from "@/lib/users";

type UsersPageProps = { searchParams?: Promise<{ q?: string; role?: string; active?: "ALL" | "active" | "inactive"; saved?: string; error?: string }> };

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const actor = await getRequiredCurrentUser();
  if (!canAccessUserManagement(actor)) redirect("/dashboard");
  const users = await getManagedUsers(actor, { q: params?.q, role: (params?.role as never) || "ALL", active: params?.active || "ALL" });
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader eyebrow="Users & Access" title="User Management" description="Create users, assign roles, link student accounts, reset passwords, and control active status." />
        <Link href="/dashboard/users/new" className="rounded-md bg-primary px-4 py-3 text-sm font-bold text-on-primary hover:bg-primary-pressed active:bg-primary-deep">New User</Link>
      </div>
      {params?.saved ? <div className="rounded-lg border border-success/30 bg-tint-mint p-4 text-sm font-semibold text-success">User changes saved.</div> : null}
      <section className="rounded-lg border border-hairline bg-canvas p-4 shadow-soft">
        <form className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
          <input name="q" defaultValue={params?.q} placeholder="Search name or email" className="h-11 rounded-md border border-hairline bg-surface px-3 text-sm text-ink" />
          <select name="role" defaultValue={params?.role || "ALL"} className="h-11 rounded-md border border-hairline bg-surface px-3 text-sm text-ink"><option value="ALL">All roles</option>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select>
          <select name="active" defaultValue={params?.active || "ALL"} className="h-11 rounded-md border border-hairline bg-surface px-3 text-sm text-ink"><option value="ALL">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
          <button className="h-11 rounded-md bg-primary px-4 text-sm font-bold text-on-primary">Filter</button>
        </form>
      </section>
      <section className="overflow-hidden rounded-lg border border-hairline bg-canvas shadow-soft">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-3 border-b border-hairline bg-surface px-4 py-3 text-xs font-semibold uppercase text-slate">
          <span>User</span><span>Role</span><span>School</span><span>Status</span><span>Actions</span>
        </div>
        {users.map((user) => (
          <div key={user.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-3 border-b border-hairline px-4 py-4 text-sm last:border-b-0">
            <div><p className="font-semibold text-ink">{user.name}</p><p className="text-slate">{user.email}</p></div>
            <RoleBadge role={user.role} />
            <span className="text-slate">{user.schoolName || "Platform"}</span>
            <span className={user.isActive ? "font-semibold text-success" : "font-semibold text-error"}>{user.isActive ? "Active" : "Inactive"}</span>
            <Link href={`/dashboard/users/${user.id}`} className="font-semibold text-brand-orange hover:text-ink">Manage</Link>
          </div>
        ))}
        {users.length === 0 ? <div className="p-8 text-center text-sm text-slate">No users match the current filters.</div> : null}
      </section>
    </div>
  );
}
