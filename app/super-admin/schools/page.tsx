import { Building2, ExternalLink, Plus } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getReadableTextColor } from "@/lib/color-contrast";

async function getSchools() {
  try {
    return await db.school.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        shortName: true,
        code: true,
        subdomain: true,
        customDomain: true,
        city: true,
        country: true,
        email: true,
        primaryColor: true,
        logoUrl: true,
        createdAt: true,
        _count: {
          select: {
            students: { where: { status: "ACTIVE", deletedAt: null } },
            classes: true,
            users: { where: { isActive: true } },
          },
        },
      },
    });
  } catch {
    return [];
  }
}

export default async function SchoolsPage() {
  const schools = await getSchools();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">All Schools</h1>
          <p className="mt-1 text-sm text-slate">
            {schools.length} school tenant{schools.length !== 1 ? "s" : ""} registered on the platform.
          </p>
        </div>
        <Link
          href="/super-admin/schools/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-pressed active:bg-primary-deep"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create School
        </Link>
      </div>

      {schools.length === 0 ? (
        <div className="rounded-lg border border-hairline bg-canvas px-5 py-16 text-center shadow-soft">
          <Building2 className="mx-auto h-9 w-9 text-slate/40" />
          <p className="mt-3 text-sm font-semibold text-ink">No schools yet</p>
          <p className="mt-1 text-sm text-slate">Create the first school to get started.</p>
          <Link
            href="/super-admin/schools/new"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
          >
            <Plus className="h-4 w-4" />
            Create School
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-hairline bg-canvas shadow-soft">
          <table className="w-full text-sm">
            <thead className="border-b border-hairline bg-surface">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate">
                  School
                </th>
                <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate lg:table-cell">
                  Domain / Subdomain
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate">
                  Students
                </th>
                <th className="hidden px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate sm:table-cell">
                  Classes
                </th>
                <th className="hidden px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate sm:table-cell">
                  Users
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {schools.map((school) => {
                const domain =
                  school.customDomain ??
                  (school.subdomain ? `${school.subdomain}.refugeeschoolos.com` : null);

                return (
                  <tr key={school.id} className="hover:bg-surface/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-on-dark"
                          style={{ backgroundColor: school.primaryColor, color: getReadableTextColor(school.primaryColor) }}
                        >
                          {school.code.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-ink">{school.name}</p>
                          <p className="text-xs text-slate">
                            {school.code}
                            {school.city ? ` · ${school.city}, ${school.country}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-4 lg:table-cell">
                      {domain ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-xs font-mono text-slate">
                          {domain}
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </span>
                      ) : (
                        <span className="text-xs text-slate/50">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-ink">
                      {school._count.students}
                    </td>
                    <td className="hidden px-5 py-4 text-right text-slate sm:table-cell">
                      {school._count.classes}
                    </td>
                    <td className="hidden px-5 py-4 text-right text-slate sm:table-cell">
                      {school._count.users}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/super-admin/schools/${school.id}`}
                        className="text-sm font-semibold text-brand-orange hover:text-ink"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
