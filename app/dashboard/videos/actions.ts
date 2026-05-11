"use server";

import { redirect } from "next/navigation";
import { canUploadVideos } from "@/lib/rbac";
import { demoCurrentUser } from "@/lib/students";
import { canManageVideoClass, detectVideoProvider } from "@/lib/videos";

export async function createVideoLesson(formData: FormData) {
  if (!canUploadVideos(demoCurrentUser.role)) {
    redirect("/dashboard/videos/new?error=permission");
  }

  const videoUrl = String(formData.get("videoUrl") || "");
  const classId = String(formData.get("classId") || "");
  const provider = detectVideoProvider(videoUrl);

  if (!canManageVideoClass(demoCurrentUser, classId)) {
    redirect("/dashboard/videos/new?error=You can only manage video lessons for your assigned school classes.");
  }

  if (!videoUrl.startsWith("https://") && !videoUrl.startsWith("http://")) {
    redirect("/dashboard/videos/new?error=Video URL must start with http or https.");
  }

  redirect(`/dashboard/videos?created=1&provider=${provider}`);
}
