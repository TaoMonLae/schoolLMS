"use server";

import { redirect } from "next/navigation";
import { createSchool } from "@/lib/schools";
import { getRequiredSession, sessionToAppUser } from "@/lib/session";
import { TenantAccessError } from "@/lib/tenant";
import { CreateSchoolSchema, formDataToObject } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export async function createSchoolAction(formData: FormData) {
  const session = await getRequiredSession();
  const user = sessionToAppUser(session);

  const raw = formDataToObject(formData);
  const result = CreateSchoolSchema.safeParse(raw);

  if (!result.success) {
    const firstError = Object.values(result.error.flatten().fieldErrors)[0]?.[0] ?? "invalid";
    logger.warn("createSchoolAction: validation failed", { errors: result.error.flatten().fieldErrors });
    redirect(`/super-admin/schools/new?error=${encodeURIComponent(firstError)}`);
  }

  try {
    const school = await createSchool(user, result.data);
    await audit.schoolCreated(user, school.id, school.name);
    redirect(`/super-admin/schools/${school.id}?created=1`);
  } catch (err) {
    if (err instanceof TenantAccessError) {
      redirect("/super-admin/schools/new?error=permission");
    }
    // Re-throw Next.js redirect signals
    throw err;
  }
}
