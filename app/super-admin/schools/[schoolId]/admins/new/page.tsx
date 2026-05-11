import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { createSchoolAdminAction } from "../actions";

async function getSchoolName(schoolId: string): Promise<string | null> {
  try {
    const school = await db.school.findUnique({ where: { id: schoolId }, select: { name: true } });
    return school?.name ?? null;
  } catch {
    return null;
  }
}

export default async function NewSchoolAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { schoolId } = await params;
  const sp = await searchParams;
  const schoolName = await getSchoolName(schoolId);

  if (!schoolName) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link
          href={`/super-admin/schools/${schoolId}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to {schoolName}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-ink">Create School Admin</h1>
        <p className="mt-1 text-sm text-slate">
          This admin will have full management access to{" "}
          <span className="font-semibold text-ink">{schoolName}</span> and will only be able to
          access data scoped to that school.
        </p>
      </div>

      {sp.error === "duplicate" && (
        <div className="rounded-lg border border-error/30 bg-tint-rose px-4 py-3 text-sm font-semibold text-error">
          A user with that email address already exists.
        </div>
      )}
      {sp.error === "permission" && (
        <div className="rounded-lg border border-error/30 bg-tint-rose px-4 py-3 text-sm font-semibold text-error">
          Only SUPER_ADMIN can create school admin accounts.
        </div>
      )}

      <form
        action={createSchoolAdminAction}
        className="space-y-5 rounded-lg border border-hairline bg-canvas p-6 shadow-soft"
      >
        <input type="hidden" name="schoolId" value={schoolId} />

        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-ink">
            Full Name <span className="text-brand-orange">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="School Administrator"
            className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-2.5 text-sm text-ink outline-none ring-primary/20 placeholder:text-slate/50 focus:border-primary focus:ring-4"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-ink">
            Email Address <span className="text-brand-orange">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="admin@school.org"
            className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-2.5 text-sm text-ink outline-none ring-primary/20 placeholder:text-slate/50 focus:border-primary focus:ring-4"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-ink">
            Temporary Password <span className="text-brand-orange">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={10}
            placeholder="Minimum 10 characters"
            className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-2.5 text-sm text-ink outline-none ring-primary/20 placeholder:text-slate/50 focus:border-primary focus:ring-4"
          />
          <p className="mt-1 text-xs text-slate">
            The admin should change this on first login. Passwords are hashed with bcrypt before
            storage.
          </p>
        </div>

        <div className="rounded-md border border-hairline bg-surface p-4">
          <p className="text-xs font-semibold text-ink">Tenant scope for this account</p>
          <p className="mt-1 text-xs text-slate">
            This admin will be assigned to{" "}
            <code className="rounded bg-canvas px-1">{schoolId}</code> and will only ever see data
            scoped to that school. Cross-school access is blocked by the tenant guard on every query.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
          <Link
            href={`/super-admin/schools/${schoolId}`}
            className="inline-flex items-center justify-center rounded-md border border-hairline px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-pressed active:bg-primary-deep"
          >
            Create Admin Account
          </button>
        </div>
      </form>
    </div>
  );
}
