import { PageHeader } from "@/components/page-header";
import { updateSchoolBranding } from "@/app/dashboard/settings/branding/actions";
import { BrandingForm } from "@/app/dashboard/settings/branding/branding-form";
import { canEditSchoolBranding, getSchoolBrandingForUser } from "@/lib/branding";
import { getRequiredCurrentUser } from "@/lib/session";
import { TenantAccessError } from "@/lib/tenant";

type BrandingPageProps = {
  searchParams?: Promise<{ saved?: string; error?: string; schoolId?: string }>;
};

export default async function BrandingPage({ searchParams }: BrandingPageProps) {
  const params = await searchParams;
  const currentUser = await getRequiredCurrentUser();
  const requestedSchoolId = params?.schoolId;

  if (currentUser.role === "SUPER_ADMIN" && !requestedSchoolId && !currentUser.schoolId) {
    return (
      <div className="space-y-6 pb-10">
        <PageHeader
          eyebrow="Settings"
          title="Custom School Branding"
          description="Super admins must open branding with an explicit school context so the wrong tenant is never updated."
        />
        <div className="rounded-lg border border-[#f2d2a8] bg-[#fff7e8] p-4 text-sm font-semibold text-[#7b4a12]">
          Add ?schoolId=&lt;school-id&gt; to the URL or open this page from a specific school record.
        </div>
      </div>
    );
  }

  let school;
  try {
    school = await getSchoolBrandingForUser(currentUser, requestedSchoolId);
  } catch (error) {
    if (error instanceof TenantAccessError) {
      return (
        <div className="space-y-6 pb-10">
          <PageHeader eyebrow="Settings" title="Custom School Branding" description="Branding requires a valid school context." />
          <div className="rounded-lg border border-[#f2b9af] bg-[#ffe4df] p-4 text-sm font-semibold text-[#8b2b20]">
            {error.message}
          </div>
        </div>
      );
    }
    throw error;
  }

  const canEdit = canEditSchoolBranding(currentUser, school.id);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Settings"
        title="Custom School Branding"
        description="Control how your school appears across the dashboard, login page, reports, and PDF exports."
      />

      {params?.saved ? (
        <div className="rounded-lg border border-[#b9dfac] bg-[#e8f3dc] p-4 text-sm font-semibold text-[#315933]">
          Branding saved successfully. Refreshing this page will show these values from the database.
        </div>
      ) : null}

      <BrandingForm school={school} canEdit={canEdit} action={updateSchoolBranding} error={params?.error} />
    </div>
  );
}
