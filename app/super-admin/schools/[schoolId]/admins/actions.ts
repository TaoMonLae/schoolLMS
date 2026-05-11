"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSchoolAdmin } from "@/lib/schools";
import { getRequiredSession, sessionToAppUser } from "@/lib/session";
import { TenantAccessError } from "@/lib/tenant";
import { CreateSchoolAdminSchema, formDataToObject } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

// bcrypt cost factor — 12 rounds is the recommended minimum for 2024+
// Configurable via BCRYPT_ROUNDS env var (must be 10–14)
const BCRYPT_ROUNDS = (() => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS ?? "12", 10);
  return Number.isFinite(rounds) && rounds >= 10 && rounds <= 14 ? rounds : 12;
})();

export async function createSchoolAdminAction(formData: FormData) {
  const session = await getRequiredSession();
  const user = sessionToAppUser(session);

  const raw = formDataToObject(formData);
  const result = CreateSchoolAdminSchema.safeParse(raw);

  if (!result.success) {
    const schoolId = String(formData.get("schoolId") ?? "");
    const fieldErrors = result.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors)[0]?.[0] ?? "invalid";
    logger.warn("createSchoolAdminAction: validation failed", { schoolId, errors: fieldErrors });
    redirect(`/super-admin/schools/${schoolId}/admins/new?error=${encodeURIComponent(firstError)}`);
  }

  const { schoolId, name, email, password } = result.data;

  // Hash password with bcrypt (12 rounds ≈ 250ms on modern hardware)
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    const newAdmin = await createSchoolAdmin(user, schoolId, {
      name,
      email,
      passwordHash,
    });
    await audit.adminCreated(user, newAdmin.id, schoolId);
  } catch (err) {
    if (err instanceof TenantAccessError) {
      redirect(`/super-admin/schools/${schoolId}/admins/new?error=permission`);
    }
    if (err instanceof Error && err.message.includes("already exists")) {
      redirect(`/super-admin/schools/${schoolId}/admins/new?error=duplicate`);
    }
    throw err;
  }

  redirect(`/super-admin/schools/${schoolId}?saved=1`);
}
