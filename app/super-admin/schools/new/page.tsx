import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createSchoolAction } from "./actions";

export default function NewSchoolPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/super-admin/schools"
          className="inline-flex items-center gap-1.5 text-sm text-slate hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to Schools
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-ink">Create New School</h1>
        <p className="mt-1 text-sm text-slate">
          Provisioning a school creates an isolated tenant. All data created under it will be
          scoped to its <code className="rounded bg-surface px-1 text-xs">school_id</code>.
        </p>
      </div>

      <form action={createSchoolAction} className="space-y-6 rounded-lg border border-hairline bg-canvas p-6 shadow-soft">
        {/* Identity */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold uppercase tracking-wide text-brand-orange">
            School Identity
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-ink">
                School Name <span className="text-brand-orange">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Mon Refugee Learning Centre"
                className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-2.5 text-sm text-ink outline-none ring-primary/20 placeholder:text-slate/50 focus:border-primary focus:ring-4"
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
                placeholder="Mon RLC"
                className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-2.5 text-sm text-ink outline-none ring-primary/20 placeholder:text-slate/50 focus:border-primary focus:ring-4"
              />
            </div>
          </div>
          <div>
            <label htmlFor="code" className="block text-sm font-semibold text-ink">
              School Code <span className="text-brand-orange">*</span>
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              placeholder="MON-RLC"
              className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-2.5 text-sm font-mono text-ink uppercase outline-none ring-primary/20 placeholder:text-slate/50 placeholder:font-sans placeholder:normal-case focus:border-primary focus:ring-4"
            />
            <p className="mt-1 text-xs text-slate">
              Unique identifier used in reports and student numbers (e.g. MON-RLC). Will be
              uppercased automatically.
            </p>
          </div>
        </fieldset>

        {/* Location */}
        <fieldset className="space-y-4 border-t border-hairline pt-5">
          <legend className="text-sm font-semibold uppercase tracking-wide text-brand-orange">
            Location &amp; Contact
          </legend>
          <div>
            <label htmlFor="address" className="block text-sm font-semibold text-ink">
              Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              placeholder="Sentul, Kuala Lumpur, Malaysia"
              className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-2.5 text-sm text-ink outline-none ring-primary/20 placeholder:text-slate/50 focus:border-primary focus:ring-4"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="block text-sm font-semibold text-ink">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                placeholder="Kuala Lumpur"
                className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-2.5 text-sm text-ink outline-none ring-primary/20 placeholder:text-slate/50 focus:border-primary focus:ring-4"
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-semibold text-ink">
                Country
              </label>
              <input
                id="country"
                name="country"
                type="text"
                placeholder="Malaysia"
                className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-2.5 text-sm text-ink outline-none ring-primary/20 placeholder:text-slate/50 focus:border-primary focus:ring-4"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-ink">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+60 12 000 0000"
                className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-2.5 text-sm text-ink outline-none ring-primary/20 placeholder:text-slate/50 focus:border-primary focus:ring-4"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-ink">
                School Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="admin@school.org"
                className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-2.5 text-sm text-ink outline-none ring-primary/20 placeholder:text-slate/50 focus:border-primary focus:ring-4"
              />
            </div>
          </div>
          <div>
            <label htmlFor="timezone" className="block text-sm font-semibold text-ink">
              Timezone
            </label>
            <input
              id="timezone"
              name="timezone"
              type="text"
              defaultValue="Asia/Kuala_Lumpur"
              placeholder="Asia/Kuala_Lumpur"
              className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-2.5 text-sm text-ink outline-none ring-primary/20 placeholder:text-slate/50 focus:border-primary focus:ring-4"
            />
          </div>
        </fieldset>

        {/* Domain */}
        <fieldset className="space-y-4 border-t border-hairline pt-5">
          <legend className="text-sm font-semibold uppercase tracking-wide text-brand-orange">
            Subdomain &amp; Custom Domain
          </legend>
          <div>
            <label htmlFor="subdomain" className="block text-sm font-semibold text-ink">
              Subdomain
            </label>
            <div className="mt-2 flex rounded-md border border-hairline bg-canvas focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20">
              <input
                id="subdomain"
                name="subdomain"
                type="text"
                placeholder="monrlc"
                className="flex-1 rounded-l-md bg-transparent px-3 py-2.5 text-sm text-ink outline-none placeholder:text-slate/50"
              />
              <span className="flex items-center rounded-r-md bg-surface px-3 text-sm text-slate">
                .refugeeschoolos.com
              </span>
            </div>
            <p className="mt-1 text-xs text-slate">
              Lowercase slug only — letters, numbers, hyphens. Leave blank to skip.
            </p>
          </div>
          <div>
            <label htmlFor="customDomain" className="block text-sm font-semibold text-ink">
              Custom Domain
            </label>
            <input
              id="customDomain"
              name="customDomain"
              type="text"
              placeholder="learn.monrlc.org"
              className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-2.5 text-sm text-ink outline-none ring-primary/20 placeholder:text-slate/50 focus:border-primary focus:ring-4"
            />
            <p className="mt-1 text-xs text-slate">Optional. Point the domain&apos;s DNS CNAME to refugeeschoolos.com first.</p>
          </div>
        </fieldset>

        {/* Branding */}
        <fieldset className="space-y-4 border-t border-hairline pt-5">
          <legend className="text-sm font-semibold uppercase tracking-wide text-brand-orange">
            Branding Colours
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="primaryColor" className="block text-sm font-semibold text-ink">
                Primary Colour
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="primaryColor"
                  name="primaryColor"
                  type="color"
                  defaultValue="#17211b"
                  className="h-9 w-12 cursor-pointer rounded-md border border-hairline bg-canvas p-0.5"
                />
                <span className="text-xs text-slate">Sidebar &amp; headings</span>
              </div>
            </div>
            <div>
              <label htmlFor="secondaryColor" className="block text-sm font-semibold text-ink">
                Secondary Colour
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="secondaryColor"
                  name="secondaryColor"
                  type="color"
                  defaultValue="#b46a45"
                  className="h-9 w-12 cursor-pointer rounded-md border border-hairline bg-canvas p-0.5"
                />
                <span className="text-xs text-slate">Accents &amp; links</span>
              </div>
            </div>
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-hairline pt-5 sm:flex-row sm:justify-end">
          <Link
            href="/super-admin/schools"
            className="inline-flex items-center justify-center rounded-md border border-hairline px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-pressed active:bg-primary-deep"
          >
            Create School Tenant
          </button>
        </div>
      </form>
    </div>
  );
}
