"use client";

import { Building2, Globe2, ImageUp, Mail, MapPin, Phone, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { SchoolLogo } from "@/components/school-logo";
import type { SchoolSummary } from "@/lib/types";

type BrandingFormProps = {
  school: SchoolSummary;
  canEdit: boolean;
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
};

export function BrandingForm({ school, canEdit, action, error }: BrandingFormProps) {
  const [values, setValues] = useState({
    name: school.name,
    shortName: school.shortName ?? "",
    subdomain: school.subdomain ?? "",
    customDomain: school.customDomain ?? "",
    primaryColor: school.primaryColor,
    secondaryColor: school.secondaryColor,
    phone: school.phone ?? "",
    email: school.email ?? "",
    website: school.website ?? "",
    address: school.address ?? "",
    city: school.city ?? "",
    country: school.country ?? "",
    timezone: school.timezone ?? ""
  });
  const [removeLogo, setRemoveLogo] = useState(false);
  const [selectedLogoUrl, setSelectedLogoUrl] = useState<string | null>(null);

  const previewSchool = useMemo<SchoolSummary>(() => ({
    ...school,
    ...values,
    shortName: values.shortName || undefined,
    subdomain: values.subdomain || undefined,
    customDomain: values.customDomain || undefined,
    logoUrl: removeLogo ? undefined : selectedLogoUrl ?? school.logoUrl
  }), [removeLogo, school, selectedLogoUrl, values]);

  const disabled = !canEdit;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <form action={action} className="space-y-5">
        <input type="hidden" name="schoolId" value={school.id} />
        {removeLogo ? <input type="hidden" name="removeLogo" value="true" /> : null}
        {!canEdit ? (
          <div className="flex items-start gap-3 rounded-lg border border-[#f2d2a8] bg-[#fff7e8] p-4 text-sm text-[#7b4a12]">
            <ShieldAlert className="mt-0.5 h-4 w-4" />
            <p><strong>Read-only.</strong> Only school administrators for this school, or super admins with an explicit school context, can edit branding.</p>
          </div>
        ) : null}
        {error ? <FieldError message={error} /> : null}

        <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">School Identity</h2>
          <p className="mt-1 text-sm text-moss">These values are saved to the school record and reused across tenant UI, login, and exports.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <TextField label="Full school name" name="name" value={values.name} onChange={(name) => setValues((v) => ({ ...v, name }))} disabled={disabled} required />
            <TextField label="Short display name" name="shortName" value={values.shortName} onChange={(shortName) => setValues((v) => ({ ...v, shortName }))} disabled={disabled} />
            <TextField label="School code" name="codeDisplay" value={school.code} disabled helper="Managed by platform policy; contact a super admin to change it." />
            <TextField label="Subdomain" name="subdomain" value={values.subdomain} onChange={(subdomain) => setValues((v) => ({ ...v, subdomain }))} disabled={disabled} helper="Letters, numbers, and hyphens only." />
            <TextField label="Custom domain" name="customDomain" value={values.customDomain} onChange={(customDomain) => setValues((v) => ({ ...v, customDomain }))} disabled={disabled} helper="Example: school.example.org" />
          </div>

          <div className="mt-5 rounded-lg border border-line bg-rice p-4">
            <div className="flex items-center gap-4">
              <SchoolLogo school={previewSchool} className="h-16 w-16" iconClassName="h-8 w-8" />
              <div className="min-w-0 flex-1">
                <label htmlFor="logo" className="text-sm font-semibold text-ink">Logo</label>
                <input
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  disabled={disabled || removeLogo}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    setSelectedLogoUrl(file ? URL.createObjectURL(file) : null);
                    if (file) setRemoveLogo(false);
                  }}
                  className="mt-2 w-full rounded-md border border-line bg-white px-3 py-3 text-sm text-moss file:mr-4 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white disabled:opacity-60"
                />
                <p className="mt-2 text-xs leading-5 text-moss">PNG, JPG/JPEG, WebP, or SVG up to 2 MB. The file contents are verified before saving.</p>
              </div>
            </div>
            <button type="button" disabled={disabled || (!school.logoUrl && !selectedLogoUrl)} onClick={() => { setRemoveLogo(true); setSelectedLogoUrl(null); }} className="mt-3 rounded-md border border-line px-3 py-2 text-xs font-semibold text-moss hover:bg-white disabled:cursor-not-allowed disabled:opacity-60">
              Remove logo
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Theme Colors</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <ColorField label="Primary color" name="primaryColor" value={values.primaryColor} onChange={(primaryColor) => setValues((v) => ({ ...v, primaryColor }))} disabled={disabled} />
            <ColorField label="Secondary color" name="secondaryColor" value={values.secondaryColor} onChange={(secondaryColor) => setValues((v) => ({ ...v, secondaryColor }))} disabled={disabled} />
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Address and Contact</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <TextField label="Phone" name="phone" value={values.phone} onChange={(phone) => setValues((v) => ({ ...v, phone }))} disabled={disabled} />
            <TextField label="Email" name="email" type="email" value={values.email} onChange={(email) => setValues((v) => ({ ...v, email }))} disabled={disabled} />
            <TextField label="Website" name="website" value={values.website} onChange={(website) => setValues((v) => ({ ...v, website }))} disabled={disabled} helper="Use a full URL, for example https://school.example.org." />
            <TextField label="City" name="city" value={values.city} onChange={(city) => setValues((v) => ({ ...v, city }))} disabled={disabled} />
            <TextField label="Country" name="country" value={values.country} onChange={(country) => setValues((v) => ({ ...v, country }))} disabled={disabled} />
            <TextField label="Timezone" name="timezone" value={values.timezone} onChange={(timezone) => setValues((v) => ({ ...v, timezone }))} disabled={disabled} helper="IANA timezone, e.g. Asia/Kuala_Lumpur." />
          </div>
          <label htmlFor="address" className="mt-4 block text-sm font-semibold text-ink">Address</label>
          <textarea id="address" name="address" rows={3} value={values.address} onChange={(event) => setValues((v) => ({ ...v, address: event.target.value }))} disabled={disabled} className="mt-2 w-full rounded-md border border-line bg-white px-3 py-3 text-sm text-ink outline-none ring-clay/20 focus:ring-4 disabled:opacity-60" />
        </section>

        <div className="flex justify-end">
          <button disabled={disabled} className="rounded-md bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-moss disabled:cursor-not-allowed disabled:opacity-60">
            Save Branding
          </button>
        </div>
      </form>

      <aside className="space-y-5">
        <section className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
          <div className="p-5 text-white" style={{ backgroundColor: previewSchool.primaryColor }}>
            <div className="flex items-center gap-3">
              <SchoolLogo school={previewSchool} className="h-14 w-14 bg-white" iconClassName="h-7 w-7" />
              <div>
                <p className="text-xl font-semibold">{getDisplaySchoolName(previewSchool)}</p>
                <p className="text-sm text-white/75">{previewSchool.name}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink">Live Branding Preview</h2>
              <span className="rounded-full bg-rice px-3 py-1 text-xs font-semibold text-moss">{canEdit ? "Editable" : "Saved view"}</span>
            </div>
            <PreviewItem icon={Globe2} label="Portal" value={getSchoolOrigin(previewSchool)} />
            <PreviewItem icon={Mail} label="Email" value={previewSchool.email || "Not set"} />
            <PreviewItem icon={Phone} label="Phone" value={previewSchool.phone || "Not set"} />
            <PreviewItem icon={MapPin} label="Location" value={[previewSchool.city, previewSchool.country].filter(Boolean).join(", ") || previewSchool.address || "Not set"} />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Swatch label="Primary" value={previewSchool.primaryColor} />
              <Swatch label="Secondary" value={previewSchool.secondaryColor} />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <ImageUp className="h-5 w-5 text-clay" />
            <div>
              <h2 className="text-sm font-semibold text-ink">Logo storage</h2>
              <p className="text-xs leading-5 text-moss">Local development stores verified uploads under public/uploads/schools/{school.id}/ and saves the public URL to the database.</p>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}

function TextField({ label, name, value, disabled, type = "text", required, helper, onChange }: { label: string; name: string; value: string; disabled?: boolean; type?: string; required?: boolean; helper?: string; onChange?: (value: string) => void }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-ink">{label}</label>
      <input id={name} name={name} type={type} value={value} disabled={disabled} required={required} onChange={(event) => onChange?.(event.target.value)} className="mt-2 w-full rounded-md border border-line bg-white px-3 py-3 text-sm text-ink outline-none ring-clay/20 focus:ring-4 disabled:opacity-60" />
      {helper ? <p className="mt-1 text-xs text-moss">{helper}</p> : null}
    </div>
  );
}

function ColorField({ label, name, value, disabled, onChange }: { label: string; name: string; value: string; disabled?: boolean; onChange: (value: string) => void }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-ink">{label}</label>
      <div className="mt-2 flex gap-2">
        <input id={name} name={name} type="color" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="h-12 w-14 rounded-md border border-line bg-white p-1 disabled:opacity-60" />
        <input name={`${name}Text`} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 rounded-md border border-line bg-white px-3 py-3 text-sm text-ink disabled:opacity-60" />
      </div>
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return <div className="rounded-lg border border-[#f2b9af] bg-[#ffe4df] p-4 text-sm font-semibold text-[#8b2b20]">{message === "permission" ? "You do not have permission to edit this school branding." : message}</div>;
}

function PreviewItem({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-line bg-rice p-3">
      <Icon className="h-4 w-4 text-clay" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-moss">{label}</p>
        <p className="break-words text-sm font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}

function Swatch({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line p-3">
      <div className="h-8 rounded" style={{ backgroundColor: value }} />
      <p className="mt-2 text-xs font-semibold text-moss">{label}</p>
      <p className="text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function getDisplaySchoolName(school: Pick<SchoolSummary, "name" | "shortName">) {
  return school.shortName || school.name;
}

function getSchoolOrigin(school: Pick<SchoolSummary, "code" | "subdomain" | "customDomain">) {
  if (school.customDomain) return `https://${school.customDomain}`;
  return `https://${school.subdomain || school.code.toLowerCase()}.refugeeschoolos.com`;
}
