import { Download } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getRequiredCurrentUser } from "@/lib/session";
import { getLessonForUser } from "@/lib/lms";

type LessonPageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonPage({ params }: LessonPageProps) {
  const { lessonId } = await params;
  const currentUser = await getRequiredCurrentUser();
  const lesson = await getLessonForUser(currentUser, lessonId);

  if (!lesson) notFound();

  return (
    <div className="space-y-6 pb-10">
      <PageHeader eyebrow="Lesson" title={lesson.title} description={`${lesson.class.name} | ${lesson.subject.name} | Created by ${lesson.createdBy?.name || "Unknown"}`} />
      <section className="rounded-lg border border-hairline bg-canvas p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Lesson Notes</h2>
        <p className="mt-3 text-sm leading-7 text-slate">{lesson.content}</p>
      </section>
      <section className="rounded-lg border border-hairline bg-canvas p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Lesson Files</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {lesson.files.map((file) => (
            <a key={file.id} href={file.fileUrl} className="flex items-center justify-between gap-3 rounded-md border border-hairline bg-surface p-4 hover:bg-canvas">
              <div>
                <p className="text-sm font-semibold text-ink">{file.fileName}</p>
                <p className="mt-1 text-xs text-slate">{file.fileType} | {file.fileSizeBytes ? `${Math.round(file.fileSizeBytes / 1024)} KB` : "Size unavailable"}</p>
              </div>
              <Download className="h-4 w-4 text-brand-orange" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
