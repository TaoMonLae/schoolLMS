export const dynamic = "force-dynamic";

import { Building2, LayoutDashboard, LogOut, Plus, Shield } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/logout/actions";
import { getCurrentUser } from "@/lib/session";

const nav = [
  { label: "Overview", href: "/super-admin", icon: LayoutDashboard },
  { label: "Schools", href: "/super-admin/schools", icon: Building2 },
];

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-on-dark/10 bg-brand-navy text-on-dark">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-canvas/10">
              <Shield className="h-4 w-4 text-on-dark" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Refugee SchoolOS</p>
              <p className="text-[11px] text-on-dark/55">Super Admin Platform</p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-on-dark/75 hover:bg-canvas/10 hover:text-on-dark"
              >
                <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/super-admin/schools/new"
              className="flex items-center gap-1.5 rounded-md bg-canvas/10 px-3 py-1.5 text-sm font-semibold text-on-dark hover:bg-canvas/20"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              New School
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md border border-on-dark/15 px-3 py-1.5 text-sm font-semibold text-on-dark/85 hover:bg-canvas/10 hover:text-on-dark"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Tenant isolation banner */}
      <div className="border-b border-hairline bg-canvas">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-6 lg:px-8">
          <Shield className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
          <p className="text-xs text-slate">
            All school data is isolated by{" "}
            <code className="rounded bg-surface px-1 font-mono text-[11px]">school_id</code>.
            Tenant guards are enforced on every query.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
