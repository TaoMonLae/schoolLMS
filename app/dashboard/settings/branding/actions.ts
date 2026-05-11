"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getRequiredCurrentUser } from "@/lib/session";
import { brandingDataForPrisma, canUpdateRequestedSchoolBranding, flattenBrandingErrors, validateSchoolBrandingForm } from "@/lib/school-branding";
import { storeSchoolLogo, validateSchoolLogo } from "@/lib/school-logo-storage";

export async function updateSchoolBranding(formData: FormData) {
  const user = await getRequiredCurrentUser();
  const parsed = validateSchoolBrandingForm(formData);
  const rawSchoolId = String(formData.get("schoolId") || "");
  const returnUrl = brandingReturnUrl(rawSchoolId, user.role === "SUPER_ADMIN");

  if (!parsed.success) {
    const { firstError } = flattenBrandingErrors(parsed.error);
    redirect(`${returnUrl}&error=${encodeURIComponent(firstError)}`);
  }

  const input = parsed.data;
  if (!canUpdateRequestedSchoolBranding(user, input.schoolId)) {
    await audit.permissionDenied(user, "school_branding", input.schoolId || "unknown", (user.schoolId ?? input.schoolId) || "unknown", "branding-update-not-authorized");
    redirect(`${returnUrl}&error=permission`);
  }

  const school = await db.school.findUnique({ select: { id: true, logoUrl: true, isActive: true }, where: { id: input.schoolId } });
  if (!school?.isActive) redirect(`${returnUrl}&error=school`);

  const logo = formData.get("logo");
  const data: ReturnType<typeof brandingDataForPrisma> & { logoUrl?: string | null } = brandingDataForPrisma(input);
  let logoEvent: "uploaded" | "replaced" | "removed" | null = null;

  if (input.removeLogo) {
    data.logoUrl = null;
    logoEvent = school.logoUrl ? "removed" : null;
  } else if (logo instanceof File && logo.size > 0) {
    const buffer = Buffer.from(await logo.arrayBuffer());
    const validation = validateSchoolLogo(buffer, logo.name, logo.size, logo.type);
    if (!validation.valid) redirect(`${returnUrl}&error=${encodeURIComponent(validation.error)}`);

    const stored = await storeSchoolLogo({
      schoolId: input.schoolId,
      fileName: logo.name,
      contentType: validation.contentType,
      buffer
    });
    data.logoUrl = stored.url;
    logoEvent = school.logoUrl ? "replaced" : "uploaded";
  }

  try {
    await db.school.update({ where: { id: input.schoolId }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect(`${returnUrl}&error=${encodeURIComponent("Subdomain or custom domain is already used by another school.")}`);
    }
    throw error;
  }

  await audit.schoolUpdated(user, input.schoolId, Object.keys(data));
  if (logoEvent) await audit.schoolLogoUpdated(user, input.schoolId, logoEvent);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings/branding");
  revalidatePath("/login");
  revalidatePath("/");

  redirect(`${returnUrl}&saved=1`);
}

function brandingReturnUrl(schoolId: string, includeSchoolId: boolean) {
  const params = new URLSearchParams();
  if (includeSchoolId && schoolId) params.set("schoolId", schoolId);
  return `/dashboard/settings/branding?${params.toString()}`;
}
