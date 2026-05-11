import { Building2, Globe2, ImageUp, Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { updateSchoolBranding } from "@/app/dashboard/settings/branding/actions";
import { canEditSchoolBranding, demoSchoolBranding, getDisplaySchoolName, getSchoolOrigin } from "@/lib/branding";
import { demoCurrentUser } from "@/lib/students";

type BrandingPageProps = {
  searchParams?: Promise<{ saved?: string; error?: string }>;
};

export default async function BrandingPage({ searchParams }: BrandingPageProps) {
  const params = await searchParams;
  const school = demoSchoolBranding;
  const canEdit = canEditSchoolBranding(demoCurrentUser, school.id);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Settings"
        title="Custom School Branding"
        description="Control how your school appears across the dashboard, login page, reports, and PDF exports."
      />

      {params?.saved ? (
        <div className="rounded-lg border border-[#b9dfac] bg-[#e8f3dc] p-4 text-sm font-semibold text-[#315933]">
          Branding validated. Connect this action to Prisma persistence when auth is enabled.
        </div>
      ) : null}
      {params?.error ? (
        <div className="rounded-lg border border-[#f2b9af] bg-[#ffe4df] p-4 text-sm font-semibold text-[#8b2b20]">
          {params.error === "permission" ? "You do not have permission to edit this school branding." : "Theme colors must be valid 6-digit hex colors."}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <form action={updateSchoolBranding} className="space-y-5">
          <input type="hidden" name="schoolId" value={school.id} />
          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">School Identity</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <TextField label="Display name" name="name" defaultValue={school.name} disabled={!canEdit} />
              <TextField label="Short name" name="shortName" defaultValue={school.shortName} disabled={!canEdit} />
              <TextField label="Subdomain" name="subdomain" defaultValue={school.subdomain} disabled={!canEdit} />
              <TextField label="Custom domain" name="customDomain" defaultValue={school.customDomain} disabled={!canEdit} />
            </div>
            <div className="mt-4">
              <label htmlFor="logo" className="text-sm font-semibold text-ink">Logo upload</label>
              <input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" disabled={!canEdit} className="mt-2 w-full rounded-md border border-line bg-white px-3 py-3 text-sm text-moss file:mr-4 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white disabled:opacity-60" />
              <p className="mt-2 text-xs leading-5 text-moss">PNG, JPG, WebP, or SVG. Storage is ready to connect when uploads are persisted.</p>
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Theme Colors</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ColorField label="Primary color" name="primaryColor" defaultValue={school.primaryColor} disabled={!canEdit} />
              <ColorField label="Secondary color" name="secondaryColor" defaultValue={school.secondaryColor} disabled={!canEdit} />
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Address and Contact</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <TextField label="Phone" name="phone" defaultValue={school.phone} disabled={!canEdit} />
              <TextField label="Email" name="email" type="email" defaultValue={school.email} disabled={!canEdit} />
              <TextField label="Website" name="website" defaultValue={school.website} disabled={!canEdit} />
            </div>
            <label htmlFor="address" className="mt-4 block text-sm font-semibold text-ink">Address</label>
            <textarea id="address" name="address" rows={3} defaultValue={school.address} disabled={!canEdit} className="mt-2 w-full rounded-md border border-line bg-white px-3 py-3 text-sm text-ink outline-none ring-clay/20 focus:ring-4 disabled:opacity-60" />
          </section>

          <div className="flex justify-end">
            <button disabled={!canEdit} className="rounded-md bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-moss disabled:cursor-not-allowed disabled:opacity-60">
              Save Branding
            </button>
          </div>
        </form>

        <aside className="space-y-5">
          <section className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
            <div className="p-5 text-white" style={{ backgroundColor: school.primaryColor }}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white/15">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xl font-semibold">{getDisplaySchoolName(school)}</p>
                  <p className="text-sm text-white/75">{school.name}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 p-5">
              <h2 className="text-lg font-semibold text-ink">School Header Preview</h2>
              <PreviewItem icon={Globe2} label="Portal" value={getSchoolOrigin(school)} />
              <PreviewItem icon={Phone} label="Phone" value={school.phone || "Not set"} />
              <PreviewItem icon={Mail} label="Email" value={school.email || "Not set"} />
              <div className="rounded-md border border-line bg-rice p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-moss">PDF/report accent</p>
                <div className="mt-3 h-3 rounded-full" style={{ backgroundColor: school.secondaryColor }} />
              </div>
            </div>
          </section>
          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <div className="flex gap-3">
              <ImageUp className="mt-1 h-5 w-5 text-clay" />
              <p className="text-sm leading-6 text-moss">
                Branding is applied through shared helpers so dashboard labels, login copy, report headings, and PDF exports use the same school identity.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function TextField({ label, name, defaultValue, disabled, type = "text" }: { label: string; name: string; defaultValue?: string; disabled?: boolean; type?: string }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold text-ink">{label}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue} disabled={disabled} className="mt-2 w-full rounded-md border border-line bg-white px-3 py-3 text-sm text-ink outline-none ring-clay/20 focus:ring-4 disabled:opacity-60" />
    </div>
  );
}

function ColorField({ label, name, defaultValue, disabled }: { label: string; name: string; defaultValue: string; disabled?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold text-ink">{label}</label>
      <div className="mt-2 flex gap-2">
        <input id={name} name={name} type="color" defaultValue={defaultValue} disabled={disabled} className="h-12 w-14 rounded-md border border-line bg-white p-1 disabled:opacity-60" />
        <input name={`${name}Text`} defaultValue={defaultValue} disabled={disabled} className="min-w-0 flex-1 rounded-md border border-line bg-white px-3 py-3 text-sm text-ink disabled:opacity-60" />
      </div>
    </div>
  );
}

function PreviewItem({ icon: Icon, label, value }: { icon: typeof Globe2; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-line bg-rice p-3">
      <Icon className="h-4 w-4 text-clay" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-moss">{label}</p>
        <p className="text-sm font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}
