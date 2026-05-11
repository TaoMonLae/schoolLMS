"use server";

import { redirect } from "next/navigation";
import { updateSchool, updateSchoolLogo } from "@/lib/schools";
import { getRequiredSession, sessionToAppUser } from "@/lib/session";
import { TenantAccessError } from "@/lib/tenant";
import { UpdateSchoolSchema, LogoUrlSchema, formDataToObject } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export async function updateSchoolAction(formData: FormData) {
  const session = await getRequiredSession();
  const user = sessionToAppUser(session);
  const schoolId = String(formData.get("schoolId") ?? "");

  if (!schoolId) redirect("/super-admin/schools?error=missing-school");

  const raw = formDataToObject(formData);
  const result = UpdateSchoolSchema.safeParse(raw);

  if (!result.success) {
    const firstError = Object.values(result.error.flatten().fieldErrors)[0]?.[0] ?? "invalid";
    logger.warn("updateSchoolAction: validation failed", { schoolId, errors: result.error.flatten().fieldErrors });
    redirect(`/super-admin/schools/${schoolId}?error=${encodeURIComponent(firstError)}`);
  }

  try {
    const changedFields = Object.keys(result.data).filter((k) => k !== "schoolId");
    await updateSchool(user, schoolId, result.data);
    await audit.schoolUpdated(user, schoolId, changedFields);
  } catch (err) {
    if (err instanceof TenantAccessError) {
      redirect(`/super-admin/schools/${schoolId}?error=permission`);
    }
    throw err;
  }

  redirect(`/super-admin/schools/${schoolId}?saved=1`);
}

export async function updateSchoolLogoAction(formData: FormData) {
  const session = await getRequiredSession();
  const user = sessionToAppUser(session);
  const schoolId = String(formData.get("schoolId") ?? "");

  if (!schoolId) redirect("/super-admin/schools?error=missing-school");

  const logoRaw = { logoUrl: String(formData.get("logoUrl") ?? "").trim() };
  const logoResult = LogoUrlSchema.safeParse(logoRaw);

  if (!logoResult.success) {
    const firstError = logoResult.error.flatten().fieldErrors.logoUrl?.[0] ?? "invalid-url";
    redirect(`/super-admin/schools/${schoolId}?error=${encodeURIComponent(firstError)}`);
  }

  try {
    await updateSchoolLogo(user, schoolId, logoResult.data.logoUrl);
    await audit.schoolLogoUpdated(user, schoolId);
  } catch (err) {
    if (err instanceof TenantAccessError) {
      redirect(`/super-admin/schools/${schoolId}?error=permission`);
    }
    throw err;
  }

  redirect(`/super-admin/schools/${schoolId}?saved=1`);
}
