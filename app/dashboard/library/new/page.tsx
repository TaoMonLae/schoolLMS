import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { uploadLibraryBook } from "@/app/dashboard/library/actions";
import { allowedBookFileTypes, allowedCoverImageTypes, maxBookFileSizeMb, maxCoverImageSizeMb } from "@/lib/library";
import { canUploadLibraryBooks } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";

type NewLibraryBookPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewLibraryBookPage({ searchParams }: NewLibraryBookPageProps) {
  const params = await searchParams;
  const currentUser = await getRequiredCurrentUser();
  const canUpload = canUploadLibraryBooks(currentUser.role);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader eyebrow="E-Library" title="Upload Book" description="Add a PDF and optional cover image to your school library." />

      {!canUpload ? (
        <div className="rounded-lg border border-hairline bg-canvas p-5 text-sm text-slate shadow-soft">Only teachers and school administrators can upload library books.</div>
      ) : (
        <form action={uploadLibraryBook} className="space-y-5">
          {params?.error ? (
            <div className="rounded-lg border border-error/30 bg-tint-rose p-4 text-sm font-semibold text-error">
              {decodeURIComponent(params.error)}
            </div>
          ) : null}

          <section className="rounded-lg border border-hairline bg-canvas p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Book Details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <TextField label="Title" name="title" required />
              <TextField label="Author" name="author" />
              <TextField label="Category" name="category" placeholder="Reader, Workbook, Stories" required />
              <TextField label="Subject" name="subject" placeholder="English, Math, Life Skills" required />
              <TextField label="Reading level" name="readingLevel" placeholder="Beginner, Primary, Intermediate" required />
              <TextField label="Language" name="language" placeholder="English, Burmese, Mon" required />
            </div>
            <label htmlFor="description" className="mt-4 block text-sm font-semibold text-ink">
              Description
            </label>
            <textarea id="description" name="description" rows={4} className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-3 text-sm text-ink outline-none ring-primary/20 focus:ring-4" />
          </section>

          <section className="rounded-lg border border-hairline bg-canvas p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Files</h2>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <FileField
                label="PDF/book file"
                name="bookFile"
                accept={allowedBookFileTypes.join(",")}
                help={`PDF only. Maximum ${maxBookFileSizeMb}MB.`}
                required
              />
              <FileField
                label="Cover image"
                name="coverImage"
                accept={allowedCoverImageTypes.join(",")}
                help={`Optional JPG, PNG, or WebP. Maximum ${maxCoverImageSizeMb}MB.`}
              />
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link href="/dashboard/library" className="inline-flex justify-center rounded-md border border-hairline bg-canvas px-4 py-3 text-sm font-semibold text-ink hover:bg-surface">
              Cancel
            </Link>
            <button className="inline-flex justify-center rounded-md bg-ink px-4 py-3 text-sm font-bold text-on-dark hover:bg-slate">
              Upload Book
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function TextField({ label, name, placeholder, required }: { label: string; name: string; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-3 text-sm text-ink outline-none ring-primary/20 placeholder:text-slate/55 focus:ring-4"
      />
    </div>
  );
}

function FileField({ label, name, accept, help, required }: { label: string; name: string; accept: string; help: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="file"
        required={required}
        accept={accept}
        className="mt-2 w-full rounded-md border border-hairline bg-canvas px-3 py-3 text-sm text-slate file:mr-4 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:font-semibold file:text-on-dark"
      />
      <p className="mt-2 text-xs leading-5 text-slate">{help}</p>
    </div>
  );
}
