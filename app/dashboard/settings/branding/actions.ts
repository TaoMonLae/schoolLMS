"use server";

import { redirect } from "next/navigation";
import { canEditSchoolBranding, demoSchoolBranding } from "@/lib/branding";
import { demoCurrentUser } from "@/lib/students";

export async function updateSchoolBranding(formData: FormData) {
  const schoolId = String(formData.get("schoolId") || demoSchoolBranding.id);

  if (!canEditSchoolBranding(demoCurrentUser, schoolId)) {
    redirect("/dashboard/settings/branding?error=permission");
  }

  const primaryColor = String(formData.get("primaryColor") || "");
  const secondaryColor = String(formData.get("secondaryColor") || "");

  if (!isHexColor(primaryColor) || !isHexColor(secondaryColor)) {
    redirect("/dashboard/settings/branding?error=colors");
  }

  redirect("/dashboard/settings/branding?saved=1");
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}
