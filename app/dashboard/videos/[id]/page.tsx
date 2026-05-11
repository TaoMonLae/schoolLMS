import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StudentPhoto } from "@/components/student-photo";
import { demoCurrentUser, demoStudents, formatEnumLabel } from "@/lib/students";
import {
  canManageVideoLesson,
  getClassVideoProgressForLesson,
  getEmbeddableVideoUrl,
  getPlaylistLessonsForUser,
  getVideoLessonForUser,
  getVideoProgressForLesson
} from "@/lib/videos";

type VideoDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const { id } = await params;
  const lesson = getVideoLessonForUser(demoCurrentUser, id);

  if (!lesson) {
    notFound();
  }

  const progress = getVideoProgressForLesson(demoCurrentUser, lesson.id);
  const playlist = getPlaylistLessonsForUser(demoCurrentUser, lesson);
  const classProgress = getClassVideoProgressForLesson(demoCurrentUser, lesson);
  const canSeeClassProgress = canManageVideoLesson(demoCurrentUser, lesson);
  const studentsById = new Map(demoStudents.map((student) => [student.id, student]));

  return (
    <div className="space-y-6 pb-10">
      <PageHeader eyebrow="Video Lessons" title={lesson.title} description={`${lesson.subjectName} | ${lesson.className} | ${lesson.durationMinutes || 0} minutes`} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
          {lesson.videoProvider === "PRIVATE" ? (
            <video controls className="aspect-video w-full bg-ink" poster={lesson.thumbnailUrl}>
              <source src={lesson.videoUrl} />
            </video>
          ) : (
            <iframe
              title={lesson.title}
              src={getEmbeddableVideoUrl(lesson)}
              className="aspect-video w-full bg-ink"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md bg-rice px-3 py-2 text-xs font-semibold text-moss">{formatEnumLabel(lesson.videoProvider)}</span>
              <span className="rounded-md bg-rice px-3 py-2 text-xs font-semibold text-moss">{formatEnumLabel(lesson.visibility)}</span>
              <span className="rounded-md bg-rice px-3 py-2 text-xs font-semibold text-moss">Uploaded by {lesson.uploadedBy}</span>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-moss">{lesson.description}</p>
          </div>
        </section>

        <aside className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <div className="border-b border-line pb-3">
            <h2 className="text-lg font-semibold text-ink">Playlist</h2>
            <p className="mt-1 text-sm text-moss">{lesson.subjectName} lessons for {lesson.className}</p>
          </div>
          <div className="mt-3 space-y-2">
            {playlist.map((playlistLesson, index) => (
              <Link
                key={playlistLesson.id}
                href={`/dashboard/videos/${playlistLesson.id}`}
                className={`block rounded-md border p-3 ${
                  playlistLesson.id === lesson.id ? "border-clay bg-[#fff2d4]" : "border-line bg-rice hover:bg-white"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-moss">Lesson {index + 1} | {playlistLesson.durationMinutes || 0} min</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-ink">{playlistLesson.title}</p>
                <p className="mt-1 text-xs text-moss">{formatEnumLabel(playlistLesson.videoProvider)}</p>
              </Link>
            ))}
          </div>
        </aside>
      </div>

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">
          {canSeeClassProgress ? "Who Watched This Lesson" : "My Progress"}
        </h2>
        <div className="mt-4 divide-y divide-line">
          {(canSeeClassProgress ? classProgress : progress.map((item) => ({ progress: item, student: studentsById.get(item.studentId) }))).map((item) => {
            const student = item.student;
            const watchedMinutes = item.progress ? Math.round(item.progress.watchedSeconds / 60) : 0;
            const completed = Boolean(item.progress?.completed);

            return (
              <div key={student?.id || item.progress?.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {student ? <StudentPhoto student={student} size="sm" /> : null}
                  <div>
                    <p className="text-sm font-semibold text-ink">{student?.preferredName || student?.legalName || "Student"}</p>
                    <p className="text-xs text-moss">{watchedMinutes} minutes watched</p>
                  </div>
                </div>
                <span className={`rounded-md px-3 py-2 text-xs font-semibold ${completed ? "bg-[#e8f3dc] text-[#315933]" : item.progress ? "bg-rice text-moss" : "bg-[#ffe4df] text-[#8b2b20]"}`}>
                  {completed ? "Completed" : item.progress ? "In progress" : "Not watched"}
                </span>
              </div>
            );
          })}
          {(canSeeClassProgress ? classProgress : progress).length === 0 ? <div className="py-6 text-sm text-moss">No progress has been recorded for this lesson yet.</div> : null}
        </div>
      </section>
    </div>
  );
}
