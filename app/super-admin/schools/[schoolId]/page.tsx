import { ArrowLeft, Check, ExternalLink, Plus, Settings, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { demoSchoolBranding } from "@/lib/branding";
import { updateSchoolAction, updateSchoolLogoAction } from "./actions";

async function getSchool(schoolId: string) {
  try {
    return await db.school.findUnique({
      where: { id: schoolId },
      include: {
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
    if (schoolId === demoSchoolBranding.id) {
      return {
        id: demoSchoolBranding.id,
        name: demoSchoolBranding.name,
        shortName: demoSchoolBranding.shortName ?? null,
        code: demoSchoolBranding.code,
        logoUrl: demoSchoolBranding.logoUrl ?? null,
        primaryColor: demoSchoolBranding.primaryColor,
        secondaryColor: demoSchoolBranding.secondaryColor,
        address: demoSchoolBranding.address ?? null,
        phone: demoSchoolBranding.phone ?? null,
        email: demoSchoolBranding.email ?? null,
        website: demoSchoolBranding.website ?? null,
        customDomain: demoSchoolBranding.customDomain ?? null,
        subdomain: demoSchoolBranding.subdomain ?? null,
        city: demoSchoolBranding.city,
        country: demoSchoolBranding.country,
        timezone: "Asia/Kuala_Lumpur",
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          students: demoSchoolBranding.activeStudents,
          classes: demoSchoolBranding.activeClasses,
          users: 4,
        },
      };
    }
    return null;
  }
}

async function getAdmins(schoolId: string) {
  try {
    return await db.user.findMany({
      where: { schoolId, role: "SCHOOL_ADMIN" },
      select: { id: true, name: true, email: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [
      {
        id: "demo-admin",
        name: "School Administrator",
        email: "admin@monrlc.example",
        isActive: true,
        createdAt: new Date(),
      },
    ];
  }
}

export default async function SchoolDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolId: string }>;
  searchParams: Promise<{ created?: string; saved?: string; error?: string }>;
}) {
  const { schoolId } = await params;
  const sp = await searchParams;
  const school = await getSchool(schoolId);

  if (!school) notFound();

  const admins = await getAdmins(schoolId);

  const subdomain = school.subdomain
    ? `${school.subdomain}.refugeeschoolos.com`
    : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/super-admin/schools"
          className="inline-flex items-center gap-1.5 text-sm text-moss hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          All Schools
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-ink">{school.name}</h1>
        <p className="mt-1 text-sm text-moss">
          {school.code}
          {school.city ? ` · ${school.city}, ${school.country}` : ""}
        </p>
      </div>

      {/* Success / error banners */}
      {sp.created === "1" && (
        <div className="flex items-center gap-2 rounded-lg border border-[#b9dfac] bg-[#e8f3dc] px-4 py-3 text-sm font-semibold text-[#315933]">
          <Check className="h-4 w-4" />
          School tenant created successfully.
        </div>
      )}
      {sp.saved === "1" && (
        <div className="flex items-center gap-2 rounded-lg border border-[#b9dfac] bg-[#e8f3dc] px-4 py-3 text-sm font-semibold text-[#315933]">
          <Check className="h-4 w-4" />
          Settings saved.
        </div>
      )}
      {sp.error && (
        <div className="rounded-lg border border-[#f2b9af] bg-[#ffe4df] px-4 py-3 text-sm font-semibold text-[#8b2b20]">
          Error: {sp.error === "permission" ? "You do not have permission to edit this school." : sp.error}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Students", value: school._count.students },
          { label: "Classes", value: school._count.classes },
          { label: "Active Users", value: school._count.users },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-line bg-white p-4 text-center shadow-soft">
            <p className="text-2xl font-semibold text-ink">{s.value}</p>
            <p className="mt-1 text-xs text-moss">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        {/* Settings form */}
        <div className="space-y-6">
          <div className="rounded-lg border border-line bg-white shadow-soft">
            <div className="flex items-center gap-2 border-b border-line px-5 py-4">
              <Settings className="h-4 w-4 text-clay" aria-hidden="true" />
              <h2 className="text-base font-semibold text-ink">School Settings</h2>
            </div>
            <form action={updateSchoolAction} className="space-y-5 p-5">
              <input type="hidden" name="schoolId" value={school.id} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-ink">
                    School Name <span className="text-clay">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    defaultValue={school.name}
                    className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-clay/20 focus:border-clay focus:ring-4"
                  />
                </div>
                <div>
                  <label htmlFor="shortName" className="block text-sm font-semibold text-ink">
                    Short Name
                  </label>
                  <input
                    id="shortName"
                    name="shortName"
                    type="text"
                    defaultValue={school.shortName ?? ""}
                    className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-clay/20 focus:border-clay focus:ring-4"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="city" className="block text-sm font-semibold text-ink">City</label>
                  <input id="city" name="city" type="text" defaultValue={school.city ?? ""}
                    className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-clay/20 focus:border-clay focus:ring-4" />
                </div>
                <div>
                  <label htmlFor="country" className="block text-sm font-semibold text-ink">Country</label>
                  <input id="country" name="country" type="text" defaultValue={school.country ?? ""}
                    className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-clay/20 focus:border-clay focus:ring-4" />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-semibold text-ink">Address</label>
                <input id="address" name="address" type="text" defaultValue={school.address ?? ""}
                  className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-clay/20 focus:border-clay focus:ring-4" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-ink">Phone</label>
                  <input id="phone" name="phone" type="tel" defaultValue={school.phone ?? ""}
                    className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-clay/20 focus:border-clay focus:ring-4" />
                </div>
                <div>
                  <label htmlFor="schoolEmail" className="block text-sm font-semibold text-ink">Email</label>
                  <input id="schoolEmail" name="email" type="email" defaultValue={school.email ?? ""}
                    className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-clay/20 focus:border-clay focus:ring-4" />
                </div>
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-semibold text-ink">Website</label>
                <input id="website" name="website" type="url" defaultValue={school.website ?? ""}
                  className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-clay/20 focus:border-clay focus:ring-4" />
              </div>

              {/* Domain */}
              <div className="border-t border-line pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-clay">Routing</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="subdomain" className="block text-sm font-semibold text-ink">Subdomain</label>
                    <div className="mt-2 flex rounded-md border border-line bg-white focus-within:border-clay focus-within:ring-4 focus-within:ring-clay/20">
                      <input id="subdomain" name="subdomain" type="text" defaultValue={school.subdomain ?? ""}
                        className="flex-1 rounded-l-md bg-transparent px-3 py-2.5 text-sm text-ink outline-none" />
                      <span className="flex items-center rounded-r-md bg-rice px-2 text-xs text-moss">.refugeeschoolos.com</span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="customDomain" className="block text-sm font-semibold text-ink">Custom Domain</label>
                    <input id="customDomain" name="customDomain" type="text" defaultValue={school.customDomain ?? ""}
                      className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-clay/20 focus:border-clay focus:ring-4" />
                  </div>
                </div>
              </div>

              {/* Colours */}
              <div className="border-t border-line pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-clay">Branding Colours</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="primaryColor" className="block text-sm font-semibold text-ink">Primary</label>
                    <div className="mt-2 flex items-center gap-2">
                      <input id="primaryColor" name="primaryColor" type="color" defaultValue={school.primaryColor}
                        className="h-9 w-12 cursor-pointer rounded-md border border-line bg-white p-0.5" />
                      <span className="text-xs text-moss">{school.primaryColor}</span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="secondaryColor" className="block text-sm font-semibold text-ink">Secondary</label>
                    <div className="mt-2 flex items-center gap-2">
                      <input id="secondaryColor" name="secondaryColor" type="color" defaultValue={school.secondaryColor}
                        className="h-9 w-12 cursor-pointer rounded-md border border-line bg-white p-0.5" />
                      <span className="text-xs text-moss">{school.secondaryColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit"
                  className="rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-moss">
                  Save Settings
                </button>
              </div>
            </form>
          </div>

          {/* Logo */}
          <div className="rounded-lg border border-line bg-white shadow-soft">
            <div className="border-b border-line px-5 py-4">
              <h2 className="text-base font-semibold text-ink">School Logo</h2>
              <p className="mt-1 text-sm text-moss">
                Provide a public URL to the school logo (PNG, SVG, or WebP recommended).
                Upload the file to your CDN or object storage first.
              </p>
            </div>
            <form action={updateSchoolLogoAction} className="p-5">
              <input type="hidden" name="schoolId" value={school.id} />
              {school.logoUrl && (
                <div className="mb-4 flex items-center gap-3 rounded-md border border-line bg-rice p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={school.logoUrl} alt="Current school logo" className="h-12 w-12 rounded-md object-contain" />
                  <p className="break-all text-xs text-moss">{school.logoUrl}</p>
                </div>
              )}
              <div className="flex gap-3">
                <input
                  name="logoUrl"
                  type="url"
                  defaultValue={school.logoUrl ?? ""}
                  placeholder="https://cdn.example.com/school-logo.png"
                  className="flex-1 rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-clay/20 placeholder:text-moss/50 focus:border-clay focus:ring-4"
                />
                <button type="submit"
                  className="shrink-0 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-moss">
                  Update Logo
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Admins panel */}
        <div className="rounded-lg border border-line bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-clay" aria-hidden="true" />
              <h2 className="text-base font-semibold text-ink">School Admins</h2>
            </div>
            <Link
              href={`/super-admin/schools/${school.id}/admins/new`}
              className="flex items-center gap-1 rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-moss"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              Add Admin
            </Link>
          </div>

          {admins.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-moss">No admins yet.</p>
              <Link
                href={`/super-admin/schools/${school.id}/admins/new`}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-clay hover:text-ink"
              >
                <Plus className="h-3.5 w-3.5" />
                Create first admin
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {admins.map((admin) => (
                <li key={admin.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-ink">{admin.name}</p>
                    <p className="text-xs text-moss">{admin.email}</p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                      admin.isActive
                        ? "bg-[#e8f3dc] text-[#315933]"
                        : "bg-rice text-moss"
                    }`}
                  >
                    {admin.isActive ? "Active" : "Inactive"}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {subdomain && (
            <div className="border-t border-line p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-moss">School URL</p>
              <a
                href={`https://${subdomain}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-clay hover:text-ink"
              >
                {subdomain}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
