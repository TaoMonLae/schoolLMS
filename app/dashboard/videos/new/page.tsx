import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { createVideoLesson } from "@/app/dashboard/videos/actions";
import { canUploadVideos } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";
import { formatEnumLabel } from "@/lib/students";
import { videoVisibilities } from "@/lib/types";
import { getManageableVideoClassesForUser, getVideoSubjectsForUser } from "@/lib/videos";

type NewVideoPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function NewVideoPage({ searchParams }: NewVideoPageProps) {
  const params = await searchParams;
  const currentUser = await getRequiredCurrentUser();
  const canUpload = canUploadVideos(currentUser.role);
  const [manageableClasses, subjects] = await Promise.all([
    getManageableVideoClassesForUser(currentUser),
    getVideoSubjectsForUser(currentUser)
  ]);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader eyebrow="Video Lessons" title="Add Video Lesson" description="Add YouTube, Vimeo, or private video links to a class and subject." />
      {!canUpload ? (
        <div className="rounded-lg border border-hairline bg-canvas p-5 text-sm text-slate shadow-soft">Only teachers and school administrators can upload video lessons.</div>
      ) : (
        <form action={createVideoLesson} className="space-y-5">
          {params?.error ? <div className="rounded-lg border border-error/30 bg-tint-rose p-4 text-sm font-semibold text-error">{decodeURIComponent(params.error)}</div> : null}
          <section className="rounded-lg border border-hairline bg-canvas p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Lesson Details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <TextField label="Title" name="title" required />
              <TextField label="Video URL" name="videoUrl" placeholder="https://youtube.com/..., https://vimeo.com/..., or private URL" required />
              <Select label="Class" name="classId" options={manageableClasses.map((item) => [item.id, item.name])} disabled={manageableClasses.length === 0} />
              <Select label="Subject" name="subjectId" options={subjects.map((item) => [item.id, item.name])} disabled={subjects.length === 0} />
              <TextField label="Thumbnail URL" name="thumbnailUrl" />
              <TextField label="Duration minutes" name="durationMinutes" type="number" />
              <Select label="Visibility" name="visibility" options={videoVisibilities.map((item) => [item, formatEnumLabel(item)])} />
            </div>
            <label htmlFor="description" className="mt-4 block text-sm font-semibold text-ink">Description</label>
            <textarea id="description" name="description" rows={4} className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-3 text-sm text-ink outline-none ring-primary/20 focus:ring-4" />
          </section>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link href="/dashboard/videos" className="inline-flex justify-center rounded-md border border-hairline bg-canvas px-4 py-3 text-sm font-semibold text-ink hover:bg-surface">Cancel</Link>
            <button disabled={manageableClasses.length === 0 || subjects.length === 0} className="inline-flex justify-center rounded-md bg-ink px-4 py-3 text-sm font-bold text-on-dark hover:bg-slate disabled:cursor-not-allowed disabled:opacity-60">Add Video</button>
          </div>
          {manageableClasses.length === 0 ? (
            <div className="rounded-lg border border-hairline bg-canvas p-4 text-sm text-slate shadow-soft">
              No classes are available for your role. Teachers can only upload videos for assigned classes.
            </div>
          ) : null}
          {subjects.length === 0 ? (
            <div className="rounded-lg border border-hairline bg-canvas p-4 text-sm text-slate shadow-soft">
              No subjects are configured for this school yet. Add school subjects before creating video lessons.
            </div>
          ) : null}
        </form>
      )}
    </div>
  );
}

function TextField({ label, name, placeholder, required, type = "text" }: { label: string; name: string; placeholder?: string; required?: boolean; type?: string }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold text-ink">{label}</label>
      <input id={name} name={name} type={type} required={required} placeholder={placeholder} className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-3 text-sm text-ink outline-none ring-primary/20 placeholder:text-slate/55 focus:ring-4" />
    </div>
  );
}

function Select({ label, name, options, disabled }: { label: string; name: string; options: string[][]; disabled?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold text-ink">{label}</label>
      <select id={name} name={name} disabled={disabled} className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-3 text-sm text-ink outline-none ring-primary/20 focus:ring-4">
        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </div>
  );
}
