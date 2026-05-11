"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { canUploadVideos } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { tenantFilter } from "@/lib/tenant";
import { videoVisibilities } from "@/lib/types";
import { canManageVideoClass, detectVideoProvider } from "@/lib/videos";

export async function createVideoLesson(formData: FormData) {
  const user = await getRequiredCurrentUser();
  if (!canUploadVideos(user.role)) redirect("/dashboard/videos/new?error=permission");

  const title = String(formData.get("title") || "").trim();
  const videoUrl = String(formData.get("videoUrl") || "").trim();
  const classId = String(formData.get("classId") || "").trim();
  const subjectId = String(formData.get("subjectId") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const thumbnailUrl = String(formData.get("thumbnailUrl") || "").trim();
  const durationRaw = String(formData.get("durationMinutes") || "").trim();
  const visibility = String(formData.get("visibility") || "CLASS_ONLY");
  const provider = detectVideoProvider(videoUrl);

  if (!title || !videoUrl || !classId || !subjectId) redirect("/dashboard/videos/new?error=All required video fields must be completed.");
  if (!videoUrl.startsWith("https://") && !videoUrl.startsWith("http://")) redirect("/dashboard/videos/new?error=Video URL must start with http or https.");
  if (!videoVisibilities.includes(visibility as never)) redirect("/dashboard/videos/new?error=Invalid visibility.");
  if (!(await canManageVideoClass(user, classId))) redirect("/dashboard/videos/new?error=You can only manage video lessons for your assigned school classes.");

  const classRecord = await db.class.findFirst({ where: { id: classId, ...tenantFilter(user) }, select: { schoolId: true } });
  const subject = await db.subject.findFirst({ where: { id: subjectId, schoolId: classRecord?.schoolId || "__none__" }, select: { id: true } });
  if (!classRecord || !subject) redirect("/dashboard/videos/new?error=Selected class and subject must belong to your school.");

  const lesson = await db.videoLesson.create({
    data: {
      schoolId: classRecord.schoolId,
      classId,
      subjectId,
      title,
      description: description || null,
      videoUrl,
      videoProvider: provider,
      thumbnailUrl: thumbnailUrl || null,
      durationMinutes: durationRaw ? Number(durationRaw) : null,
      visibility: visibility as never,
      uploadedById: user.id
    }
  });

  revalidatePath("/dashboard/videos");
  revalidatePath("/dashboard/videos/new");
  redirect(`/dashboard/videos?created=1&lesson=${lesson.id}`);
}
