import { CheckCircle2, Clock, PlayCircle, UserRound, Video } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StudentPhoto } from "@/components/student-photo";
import { VideoPlayer } from "@/components/video-player";
import { getRequiredCurrentUser } from "@/lib/session";
import { formatEnumLabel } from "@/lib/students";
import {
  canManageVideoLesson,
  getClassVideoProgressForLesson,
  getEmbeddableVideoUrl,
  getExternalVideoUrl,
  getPlaylistLessonsForUser,
  getVideoLessonForUser,
  getVideoProgressForLesson
} from "@/lib/videos";

type VideoDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const { id } = await params;
  const currentUser = await getRequiredCurrentUser();
  const lesson = await getVideoLessonForUser(currentUser, id);

  if (!lesson) {
    notFound();
  }

  const [progress, playlist, classProgress] = await Promise.all([
    getVideoProgressForLesson(currentUser, lesson.id),
    getPlaylistLessonsForUser(currentUser, lesson),
    getClassVideoProgressForLesson(currentUser, lesson)
  ]);
  const canSeeClassProgress = canManageVideoLesson(currentUser, lesson);
  const studentsById = new Map(classProgress.map((item) => [item.student.id, item.student]));
  const embedUrl = getEmbeddableVideoUrl(lesson);
  const externalUrl = getExternalVideoUrl(lesson);
  const progressRows = canSeeClassProgress ? classProgress : progress.map((item) => ({ progress: item, student: studentsById.get(item.studentId) }));
  const completedCount = progressRows.filter((item) => item.progress?.completed).length;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader eyebrow="Video Lessons" title={lesson.title} description={`${lesson.subjectName} · ${lesson.className} · ${lesson.durationMinutes || 0} minutes`} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-xl border border-hairline bg-canvas shadow-soft">
          <div className="border-b border-hairline bg-brand-navy p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-on-dark">
              <PlayCircle className="h-4 w-4 text-brand-yellow" aria-hidden="true" />
              Lesson player
            </div>
          </div>
          <VideoPlayer
            title={lesson.title}
            providerLabel={formatEnumLabel(lesson.videoProvider)}
            embedUrl={embedUrl}
            externalUrl={externalUrl}
            posterUrl={lesson.thumbnailUrl}
            privateVideo={lesson.videoProvider === "PRIVATE"}
          />
          <div className="grid gap-4 p-5 lg:grid-cols-[1fr_260px]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge>{formatEnumLabel(lesson.videoProvider)}</Badge>
                <Badge>{formatEnumLabel(lesson.visibility)}</Badge>
                <Badge>{lesson.durationMinutes || 0} min</Badge>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate">{lesson.description || "No description has been added for this lesson yet."}</p>
            </div>
            <div className="rounded-lg border border-hairline bg-surface p-md">
              <h2 className="text-sm font-semibold text-ink">Lesson metadata</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <MetaRow label="Class" value={lesson.className} />
                <MetaRow label="Subject" value={lesson.subjectName} />
                <MetaRow label="Uploaded by" value={lesson.uploadedBy} />
                <MetaRow label="Source" value={formatEnumLabel(lesson.videoProvider)} />
              </dl>
            </div>
          </div>
        </section>

        <aside className="rounded-xl border border-hairline bg-canvas p-4 shadow-soft">
          <div className="border-b border-hairline pb-3">
            <h2 className="text-lg font-semibold text-ink">Playlist</h2>
            <p className="mt-1 text-sm text-slate">{lesson.subjectName} lessons for {lesson.className}</p>
          </div>
          <div className="mt-3 space-y-2">
            {playlist.map((playlistLesson, index) => {
              const active = playlistLesson.id === lesson.id;
              return (
                <Link
                  key={playlistLesson.id}
                  href={`/dashboard/videos/${playlistLesson.id}`}
                  className={`block rounded-lg border p-3 transition ${active ? "border-primary bg-tint-lavender shadow-card" : "border-hairline bg-surface hover:border-primary/50 hover:bg-canvas"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate">Lesson {index + 1}</p>
                    <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-semibold text-slate">{formatEnumLabel(playlistLesson.videoProvider)}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-5 text-ink">{playlistLesson.title}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-slate"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{playlistLesson.durationMinutes || 0} min</p>
                  {active ? <p className="mt-2 text-xs font-semibold text-primary">Currently playing</p> : null}
                </Link>
              );
            })}
            {playlist.length === 0 ? <div className="rounded-lg border border-dashed border-hairline p-4 text-sm text-slate">No related lessons are available yet.</div> : null}
          </div>
        </aside>
      </div>

      <section className="rounded-xl border border-hairline bg-canvas p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">{canSeeClassProgress ? "Who Watched This Lesson" : "My Progress"}</h2>
            <p className="mt-1 text-sm text-slate">{completedCount} completed · {progressRows.length} tracked learner{progressRows.length === 1 ? "" : "s"}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-tint-mint px-3 py-1 text-xs font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Watch tracking
          </span>
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-hairline">
          <table className="ds-table">
            <thead>
              <tr>
                <th>Learner</th>
                <th>Minutes watched</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {progressRows.map((item) => {
                const student = item.student;
                const watchedMinutes = item.progress ? Math.round(item.progress.watchedSeconds / 60) : 0;
                const completed = Boolean(item.progress?.completed);

                return (
                  <tr key={student?.id || item.progress?.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {student ? <StudentPhoto student={student} size="sm" /> : <UserRound className="h-8 w-8 rounded-full bg-surface p-2 text-slate" aria-hidden="true" />}
                        <span className="font-semibold text-ink">{student?.preferredName || student?.legalName || "Student"}</span>
                      </div>
                    </td>
                    <td>{watchedMinutes} minutes watched</td>
                    <td>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${completed ? "bg-tint-mint text-success" : item.progress ? "bg-tint-yellow text-warning" : "bg-tint-rose text-error"}`}>
                        {completed ? "Completed" : item.progress ? "In progress" : "Not watched"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {progressRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-slate">No progress has been recorded for this lesson yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-slate">{children}</span>;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-2 text-slate"><Video className="h-3.5 w-3.5" aria-hidden="true" />{label}</dt>
      <dd className="text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}
