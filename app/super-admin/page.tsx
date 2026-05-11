import { Building2, GraduationCap, Plus, Shield, Users } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";

async function getPlatformStats() {
  try {
    const [schoolCount, studentCount, userCount] = await Promise.all([
      db.school.count(),
      db.student.count({ where: { status: "ACTIVE", deletedAt: null } }),
      db.user.count({ where: { isActive: true } }),
    ]);
    return { schoolCount, studentCount, userCount, demo: false };
  } catch {
    return { schoolCount: 0, studentCount: 0, userCount: 0, demo: false };
  }
}

async function getRecentSchools() {
  try {
    return await db.school.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        code: true,
        subdomain: true,
        city: true,
        country: true,
        createdAt: true,
        _count: {
          select: { students: { where: { status: "ACTIVE", deletedAt: null } } },
        },
      },
    });
  } catch {
    return [];
  }
}

export default async function SuperAdminPage() {
  const [stats, recentSchools] = await Promise.all([getPlatformStats(), getRecentSchools()]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Platform Overview</h1>
          <p className="mt-1 text-sm text-moss">
            All school tenants, students, and staff across Refugee SchoolOS.
            {stats.demo && (
              <span className="ml-2 rounded-md bg-rice px-2 py-0.5 text-xs font-semibold text-clay">
                Demo mode — connect DB for live data
              </span>
            )}
          </p>
        </div>
        <Link
          href="/super-admin/schools/new"
          className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-moss"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create School
        </Link>
      </div>

      {/* Platform stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Active Schools", value: stats.schoolCount, icon: Building2, href: "/super-admin/schools" },
          { label: "Active Students", value: stats.studentCount, icon: GraduationCap, href: null },
          { label: "Active Users", value: stats.userCount, icon: Users, href: null },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-rice text-clay">
                <stat.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-moss">{stat.label}</p>
                <p className="mt-0.5 text-2xl font-semibold text-ink">{stat.value.toLocaleString()}</p>
              </div>
            </div>
            {stat.href && (
              <Link href={stat.href} className="mt-4 block text-xs font-semibold text-clay hover:text-ink">
                View all →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Recent schools */}
      <div className="rounded-lg border border-line bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-ink">Schools</h2>
          <Link href="/super-admin/schools" className="text-sm font-semibold text-clay hover:text-ink">
            View all →
          </Link>
        </div>

        {recentSchools.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Building2 className="mx-auto h-8 w-8 text-moss/40" />
            <p className="mt-3 text-sm font-semibold text-ink">No schools yet</p>
            <p className="mt-1 text-sm text-moss">Get started by creating the first school tenant.</p>
            <Link
              href="/super-admin/schools/new"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss"
            >
              <Plus className="h-4 w-4" />
              Create School
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {recentSchools.map((school) => (
              <div key={school.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink text-xs font-semibold text-white">
                    {school.code.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{school.name}</p>
                    <p className="text-xs text-moss">
                      {school.code}
                      {school.city ? ` · ${school.city}, ${school.country}` : ""}
                      {school.subdomain ? ` · ${school.subdomain}.refugeeschoolos.com` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="hidden text-sm text-moss sm:block">
                    {school._count.students} student{school._count.students !== 1 ? "s" : ""}
                  </span>
                  <Link
                    href={`/super-admin/schools/${school.id}`}
                    className="text-sm font-semibold text-clay hover:text-ink"
                  >
                    Manage →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security overview */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-5">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-leaf" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-ink">Tenant Isolation Active</p>
              <p className="mt-2 text-sm leading-6 text-moss">
                Every query in the system is guarded by{" "}
                <code className="rounded bg-rice px-1 text-xs">tenantFilter(user)</code> from{" "}
                <code className="rounded bg-rice px-1 text-xs">lib/tenant.ts</code>. School admins
                see only their own school&apos;s data. A second-layer{" "}
                <code className="rounded bg-rice px-1 text-xs">filterToTenant()</code> safety net
                catches any missed query.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-white p-5">
          <div className="flex items-start gap-3">
            <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-clay" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-ink">Subdomain Routing</p>
              <p className="mt-2 text-sm leading-6 text-moss">
                Each school can be accessed via{" "}
                <code className="rounded bg-rice px-1 text-xs">subdomain.refugeeschoolos.com</code>{" "}
                or a custom domain. The middleware extracts the subdomain and passes it as the{" "}
                <code className="rounded bg-rice px-1 text-xs">x-school-subdomain</code> header for
                server-side branding resolution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
