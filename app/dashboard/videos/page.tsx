import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { VideoThumbnail } from "@/components/video-thumbnail";
import { canUploadVideos, canViewVideos } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { formatEnumLabel } from "@/lib/students";
import { videoProviders, VideoProvider } from "@/lib/types";
import { getVisibleVideoClassesForUser, getVideoSubjectsForUser, getVisibleVideoLessonsForUser } from "@/lib/videos";

type VideosPageProps = {
  searchParams?: Promise<{
    q?: string;
    classId?: string;
    subjectId?: string;
    provider?: VideoProvider | "ALL";
    created?: string;
    providerCreated?: string;
  }>;
};

export default async function VideosPage({ searchParams }: VideosPageProps) {
  const params = await searchParams;
  const currentUser = await getRequiredCurrentUser();
  const canView = canViewVideos(currentUser.role);
  const canUpload = canUploadVideos(currentUser.role);
  const [lessons, classes, subjects] = await Promise.all([
    getVisibleVideoLessonsForUser(currentUser, {
    search: params?.q,
    classId: params?.classId || "ALL",
    subjectId: params?.subjectId || "ALL",
    provider: params?.provider || "ALL"
    }),
    getVisibleVideoClassesForUser(currentUser),
    getVideoSubjectsForUser(currentUser)
  ]);

  if (!canView) {
    return <PageHeader eyebrow="Video Lessons" title="Video Access" description="You do not have permission to view video lessons." />;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader eyebrow="Video Lessons" title="Class Video Lessons" description="Search class-based lessons, filter by subject, and track student progress." />
        {canUpload ? (
          <Link href="/dashboard/videos/new" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-bold text-on-dark hover:bg-slate">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Video
          </Link>
        ) : null}
      </div>

      {params?.created ? (
        <div className="rounded-lg border border-success/30 bg-tint-mint p-4 text-sm font-semibold text-success">
Video lesson created and saved.
        </div>
      ) : null}

      <section className="rounded-lg border border-hairline bg-canvas p-4 shadow-soft">
        <form className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
          <label className="relative">
            <span className="sr-only">Search videos</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" aria-hidden="true" />
            <input name="q" defaultValue={params?.q} placeholder="Search title, subject, teacher" className="h-11 w-full rounded-md border border-hairline bg-surface pl-9 pr-3 text-sm text-ink outline-none ring-primary/20 placeholder:text-slate/60 focus:ring-4" />
          </label>
          <Select name="classId" defaultValue={params?.classId || "ALL"} label="All classes" options={classes.map((item) => [item.id, item.name])} />
          <Select name="subjectId" defaultValue={params?.subjectId || "ALL"} label="All subjects" options={subjects.map((item) => [item.id, item.name])} />
          <Select name="provider" defaultValue={params?.provider || "ALL"} label="All providers" options={videoProviders.map((item) => [item, formatEnumLabel(item)])} />
          <button className="h-11 rounded-md bg-ink px-4 text-sm font-bold text-on-dark hover:bg-slate">Filter</button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lessons.map((lesson) => (
          <article key={lesson.id} className="rounded-lg border border-hairline bg-canvas p-4 shadow-soft">
            <VideoThumbnail lesson={lesson} />
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-orange">{lesson.subjectName} | {lesson.className}</p>
              <h2 className="mt-2 text-lg font-semibold leading-6 text-ink">{lesson.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate">{lesson.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-md bg-surface px-2 py-1 text-xs font-semibold text-slate">{formatEnumLabel(lesson.videoProvider)}</span>
                <span className="rounded-md bg-surface px-2 py-1 text-xs font-semibold text-slate">{lesson.durationMinutes || 0} min</span>
                <span className="rounded-md bg-surface px-2 py-1 text-xs font-semibold text-slate">{formatEnumLabel(lesson.visibility)}</span>
              </div>
              <Link href={`/dashboard/videos/${lesson.id}`} className="mt-5 inline-flex w-full justify-center rounded-md bg-ink px-4 py-2 text-sm font-bold text-on-dark hover:bg-slate">
                Watch Lesson
              </Link>
            </div>
          </article>
        ))}
      </section>

      {lessons.length === 0 ? <div className="rounded-lg border border-hairline bg-canvas p-8 text-center text-sm text-slate shadow-soft">No video lessons match the current filters.</div> : null}
    </div>
  );
}

function Select({ name, defaultValue, label, options }: { name: string; defaultValue: string; label: string; options: string[][] }) {
  return (
    <select name={name} defaultValue={defaultValue} className="h-11 rounded-md border border-hairline bg-surface px-3 text-sm text-ink outline-none ring-primary/20 focus:ring-4">
      <option value="ALL">{label}</option>
      {options.map(([value, text]) => (
        <option key={value} value={value}>
          {text}
        </option>
      ))}
    </select>
  );
}
