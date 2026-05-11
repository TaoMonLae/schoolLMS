import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { login } from "@/app/login/actions";
import { SchoolLogo } from "@/components/school-logo";
export const dynamic = "force-dynamic";

import { getDisplaySchoolName, getFirstActiveSchoolBranding } from "@/lib/branding";

export default async function LoginPage() {
  const school = await getFirstActiveSchoolBranding();
  const schoolName = getDisplaySchoolName(school);

  return (
    <main className="flex min-h-screen bg-rice">
      <section className="hidden w-1/2 p-10 text-white lg:flex lg:flex-col lg:justify-between" style={{ backgroundColor: school.primaryColor }}>
        <Link href="/" className="flex items-center gap-3">
          <SchoolLogo school={school} />
          <span className="text-base font-semibold">{schoolName}</span>
        </Link>
        <div className="max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.22em]" style={{ color: school.secondaryColor }}>School login</p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight">Return to {schoolName}.</h1>
          <p className="mt-5 text-base leading-7 text-white/74">
            Access student records, attendance, classes, reports, and learning resources with role-based permissions.
          </p>
        </div>
        <p className="text-sm text-white/60">Built for NGO and refugee learning centre teams.</p>
      </section>

      <section className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
          <Link href="/" className="mb-8 flex items-center gap-3 lg:hidden">
            <SchoolLogo school={school} />
            <span className="text-base font-semibold text-ink">{schoolName}</span>
          </Link>
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-rice text-clay">
            <LockKeyhole className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-ink">School Login</h2>
          <p className="mt-2 text-sm leading-6 text-moss">Sign in with the account provided by your school administrator.</p>

          <form action={login} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="text-sm font-semibold text-ink">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="teacher@school.org"
                className="mt-2 w-full rounded-md border border-line bg-white px-3 py-3 text-sm text-ink outline-none ring-clay/20 placeholder:text-moss/55 focus:ring-4"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-semibold text-ink">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="mt-2 w-full rounded-md border border-line bg-white px-3 py-3 text-sm text-ink outline-none ring-clay/20 placeholder:text-moss/55 focus:ring-4"
              />
            </div>
            <button className="w-full rounded-md bg-ink px-4 py-3 text-sm font-bold text-white hover:bg-moss">
              Continue
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-moss">
            Need access?{" "}
            <a href="mailto:hello@refugeeschoolos.org" className="font-semibold text-clay hover:text-ink">
              Request a demo
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
