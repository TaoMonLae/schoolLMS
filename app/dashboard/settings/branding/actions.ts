"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { canEditSchoolBranding } from "@/lib/branding";
import { getRequiredCurrentUser } from "@/lib/session";

export async function updateSchoolBranding(formData: FormData) {
  const user = await getRequiredCurrentUser();
  const schoolId = String(formData.get("schoolId") || "");

  if (!canEditSchoolBranding(user, schoolId)) redirect("/dashboard/settings/branding?error=permission");

  const primaryColor = String(formData.get("primaryColor") || "");
  const secondaryColor = String(formData.get("secondaryColor") || "");
  if (!isHexColor(primaryColor) || !isHexColor(secondaryColor)) redirect("/dashboard/settings/branding?error=colors");

  const data = {
    name: String(formData.get("name") || "").trim(),
    shortName: optionalString(formData.get("shortName")),
    subdomain: optionalString(formData.get("subdomain")),
    customDomain: optionalString(formData.get("customDomain")),
    primaryColor,
    secondaryColor,
    phone: optionalString(formData.get("phone")),
    email: optionalString(formData.get("email")),
    website: optionalString(formData.get("website")),
    address: optionalString(formData.get("address"))
  };

  if (!data.name) redirect("/dashboard/settings/branding?error=name");

  await db.school.update({ where: { id: schoolId }, data });
  await audit.schoolUpdated(user, schoolId, Object.keys(data));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings/branding");
  redirect("/dashboard/settings/branding?saved=1");
}

function optionalString(value: FormDataEntryValue | null) {
  const stringValue = String(value || "").trim();
  return stringValue || null;
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}
