"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRequiredCurrentUser } from "@/lib/session";
import { createManagedUser, resetManagedUserPassword, setManagedUserActive, updateManagedUser } from "@/lib/users";

function stringList(formData: FormData, name: string) {
  return formData.getAll(name).map(String).filter(Boolean);
}

function parseInput(formData: FormData) {
  return {
    schoolId: optional(formData.get("schoolId")),
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    role: String(formData.get("role") || "TEACHER") as Role,
    password: optional(formData.get("password")),
    isActive: formData.get("isActive") === "on",
    caseManagerApproved: formData.get("caseManagerApproved") === "on",
    classIds: stringList(formData, "classIds"),
    studentId: optional(formData.get("studentId"))
  };
}

export async function createUserAction(formData: FormData) {
  const actor = await getRequiredCurrentUser();
  try {
    await createManagedUser(actor, parseInput(formData));
  } catch (error) {
    redirect(`/dashboard/users/new?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to create user")}`);
  }
  revalidatePath("/dashboard/users");
  redirect("/dashboard/users?saved=created");
}

export async function updateUserAction(formData: FormData) {
  const actor = await getRequiredCurrentUser();
  const id = String(formData.get("id") || "");
  try {
    await updateManagedUser(actor, id, parseInput(formData));
  } catch (error) {
    redirect(`/dashboard/users/${id}/edit?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to update user")}`);
  }
  revalidatePath("/dashboard/users");
  revalidatePath(`/dashboard/users/${id}`);
  redirect(`/dashboard/users/${id}?saved=updated`);
}

export async function resetPasswordAction(formData: FormData) {
  const actor = await getRequiredCurrentUser();
  const id = String(formData.get("id") || "");
  const password = String(formData.get("password") || "").trim();
  if (password.length < 8) redirect(`/dashboard/users/${id}?error=password`);
  await resetManagedUserPassword(actor, id, password);
  revalidatePath(`/dashboard/users/${id}`);
  redirect(`/dashboard/users/${id}?saved=password`);
}

export async function setUserActiveAction(formData: FormData) {
  const actor = await getRequiredCurrentUser();
  const id = String(formData.get("id") || "");
  await setManagedUserActive(actor, id, formData.get("isActive") === "true");
  revalidatePath("/dashboard/users");
  redirect(`/dashboard/users/${id}?saved=status`);
}

function optional(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || undefined;
}
