"use server";

import { redirect } from "next/navigation";
import { canUploadLibraryBooks } from "@/lib/rbac";
import { validateLibraryFile } from "@/lib/library";
import { demoCurrentUser } from "@/lib/students";

export async function uploadLibraryBook(formData: FormData) {
  if (!canUploadLibraryBooks(demoCurrentUser.role)) {
    redirect("/dashboard/library/new?error=permission");
  }

  const bookFile = formData.get("bookFile");
  const coverFile = formData.get("coverImage");

  if (!(bookFile instanceof File) || bookFile.size === 0) {
    redirect("/dashboard/library/new?error=book-required");
  }

  const bookValidation = validateLibraryFile({
    type: bookFile.type,
    size: bookFile.size,
    kind: "book"
  });

  if (!bookValidation.ok) {
    redirect(`/dashboard/library/new?error=${encodeURIComponent(bookValidation.message)}`);
  }

  if (coverFile instanceof File && coverFile.size > 0) {
    const coverValidation = validateLibraryFile({
      type: coverFile.type,
      size: coverFile.size,
      kind: "cover"
    });

    if (!coverValidation.ok) {
      redirect(`/dashboard/library/new?error=${encodeURIComponent(coverValidation.message)}`);
    }
  }

  redirect("/dashboard/library?uploaded=1");
}
