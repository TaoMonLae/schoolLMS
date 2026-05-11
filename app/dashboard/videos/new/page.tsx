import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { createVideoLesson } from "@/app/dashboard/videos/actions";
import { canUploadVideos } from "@/lib/rbac";
import { demoCurrentUser, formatEnumLabel } from "@/lib/students";
import { videoVisibilities } from "@/lib/types";
import { demoVideoSubjects, getManageableVideoClassesForUser } from "@/lib/videos";

type NewVideoPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function NewVideoPage({ searchParams }: NewVideoPageProps) {
  const params = await searchParams;
  const canUpload = canUploadVideos(demoCurrentUser.role);
  const manageableClasses = getManageableVideoClassesForUser(demoCurrentUser);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader eyebrow="Video Lessons" title="Add Video Lesson" description="Add YouTube, Vimeo, or private video links to a class and subject." />
      {!canUpload ? (
        <div className="rounded-lg border border-line bg-white p-5 text-sm text-moss shadow-soft">Only teachers and school administrators can upload video lessons.</div>
      ) : (
        <form action={createVideoLesson} className="space-y-5">
          {params?.error ? <div className="rounded-lg border border-[#f2b9af] bg-[#ffe4df] p-4 text-sm font-semibold text-[#8b2b20]">{decodeURIComponent(params.error)}</div> : null}
          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Lesson Details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <TextField label="Title" name="title" required />
              <TextField label="Video URL" name="videoUrl" placeholder="https://youtube.com/..., https://vimeo.com/..., or private URL" required />
              <Select label="Class" name="classId" options={manageableClasses.map((item) => [item.id, item.name])} />
              <Select label="Subject" name="subjectId" options={demoVideoSubjects.map((item) => [item.id, item.name])} />
              <TextField label="Thumbnail URL" name="thumbnailUrl" />
              <TextField label="Duration minutes" name="durationMinutes" type="number" />
              <Select label="Visibility" name="visibility" options={videoVisibilities.map((item) => [item, formatEnumLabel(item)])} />
            </div>
            <label htmlFor="description" className="mt-4 block text-sm font-semibold text-ink">Description</label>
            <textarea id="description" name="description" rows={4} className="mt-2 w-full rounded-md border border-line bg-white px-3 py-3 text-sm text-ink outline-none ring-clay/20 focus:ring-4" />
          </section>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link href="/dashboard/videos" className="inline-flex justify-center rounded-md border border-line bg-white px-4 py-3 text-sm font-semibold text-ink hover:bg-rice">Cancel</Link>
            <button className="inline-flex justify-center rounded-md bg-ink px-4 py-3 text-sm font-bold text-white hover:bg-moss">Add Video</button>
          </div>
          {manageableClasses.length === 0 ? (
            <div className="rounded-lg border border-line bg-white p-4 text-sm text-moss shadow-soft">
              No classes are available for your role. Teachers can only upload videos for assigned classes.
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
      <input id={name} name={name} type={type} required={required} placeholder={placeholder} className="mt-2 w-full rounded-md border border-line bg-white px-3 py-3 text-sm text-ink outline-none ring-clay/20 placeholder:text-moss/55 focus:ring-4" />
    </div>
  );
}

function Select({ label, name, options }: { label: string; name: string; options: string[][] }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold text-ink">{label}</label>
      <select id={name} name={name} className="mt-2 w-full rounded-md border border-line bg-white px-3 py-3 text-sm text-ink outline-none ring-clay/20 focus:ring-4">
        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </div>
  );
}
