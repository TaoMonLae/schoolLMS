import { Download, LockKeyhole } from "lucide-react";
import { notFound } from "next/navigation";
import { LibraryCover } from "@/components/library-cover";
import { getLibraryBookForUser, isLibraryFileUrlAllowed } from "@/lib/library";
import { getRequiredCurrentUser } from "@/lib/session";

type LibraryBookPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LibraryBookPage({ params }: LibraryBookPageProps) {
  const { id } = await params;
  const currentUser = await getRequiredCurrentUser();
  const book = await getLibraryBookForUser(currentUser, id);

  if (!book) {
    notFound();
  }

  const canAccessFile = isLibraryFileUrlAllowed(currentUser, book, book.fileUrl);

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-lg border border-hairline bg-canvas p-5 shadow-soft">
        <div className="grid gap-6 md:grid-cols-[180px_1fr]">
          <LibraryCover book={book} size="lg" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-orange">{book.category}</p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">{book.title}</h1>
            <p className="mt-2 text-sm text-slate">{book.author || "Unknown author"}</p>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate">{book.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[[`${book.id}-subject`, book.subject], [`${book.id}-language`, book.language], [`${book.id}-readingLevel`, book.readingLevel]].map(([key, label]) => (
                <span key={key} className="rounded-md bg-surface px-3 py-2 text-xs font-semibold text-slate">
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-6">
              {canAccessFile ? (
                <a href={`/dashboard/library/${book.id}/download`} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-bold text-on-primary hover:bg-primary-pressed active:bg-primary-deep">
                  <Download className="h-4 w-4" aria-hidden="true" />
                  View / Download Book
                </a>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-md border border-hairline bg-surface px-4 py-3 text-sm font-semibold text-slate">
                  <LockKeyhole className="h-4 w-4 text-brand-orange" aria-hidden="true" />
                  File access blocked for this school.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetaCard label="Uploaded by" value={book.uploadedBy} />
        <MetaCard label="Created" value={book.createdAt} />
        <MetaCard label="Updated" value={book.updatedAt} />
        <MetaCard label="School scope" value={book.schoolId} />
      </section>
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-canvas p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
