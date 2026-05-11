import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { LibraryCover } from "@/components/library-cover";
import { PageHeader } from "@/components/page-header";
import { getLibraryBooksForUser, getLibraryFilterOptions } from "@/lib/library";
import { canUploadLibraryBooks, canViewLibrary } from "@/lib/rbac";
import { getRequiredCurrentUser } from "@/lib/session";

type LibraryPageProps = {
  searchParams?: Promise<{
    q?: string;
    subject?: string;
    language?: string;
    readingLevel?: string;
    category?: string;
    uploaded?: string;
  }>;
};

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams;
  const currentUser = await getRequiredCurrentUser();
  const allVisibleBooks = await getLibraryBooksForUser(currentUser);
  const options = getLibraryFilterOptions(allVisibleBooks);
  const books = await getLibraryBooksForUser(currentUser, {
    search: params?.q,
    subject: params?.subject || "ALL",
    language: params?.language || "ALL",
    readingLevel: params?.readingLevel || "ALL",
    category: params?.category || "ALL"
  });
  const canView = canViewLibrary(currentUser.role);
  const canUpload = canUploadLibraryBooks(currentUser.role);

  if (!canView) {
    return (
      <div className="space-y-6 pb-10">
        <PageHeader eyebrow="E-Library" title="Library Access" description="You do not have permission to view school library books." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader eyebrow="E-Library" title="School Library" description="Search, filter, view, and download books assigned to your school." />
        {canUpload ? (
          <Link href="/dashboard/library/new" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-bold text-on-primary hover:bg-primary-pressed active:bg-primary-deep">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Upload Book
          </Link>
        ) : null}
      </div>

      {params?.uploaded ? (
        <div className="rounded-lg border border-success/30 bg-tint-mint p-4 text-sm font-semibold text-success">
          Book file validated. Database and storage persistence can be connected to this upload action.
        </div>
      ) : null}

      <section className="rounded-lg border border-hairline bg-canvas p-4 shadow-soft">
        <form className="grid gap-3 lg:grid-cols-[1.4fr_repeat(4,1fr)_auto]">
          <label className="relative">
            <span className="sr-only">Search books</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" aria-hidden="true" />
            <input name="q" defaultValue={params?.q} placeholder="Search title, author, subject" className="h-11 w-full rounded-md border border-hairline bg-surface pl-9 pr-3 text-sm text-ink outline-none ring-primary/20 placeholder:text-slate/60 focus:ring-4" />
          </label>
          <FilterSelect name="subject" defaultValue={params?.subject || "ALL"} label="All subjects" values={options.subjects} />
          <FilterSelect name="language" defaultValue={params?.language || "ALL"} label="All languages" values={options.languages} />
          <FilterSelect name="readingLevel" defaultValue={params?.readingLevel || "ALL"} label="All levels" values={options.readingLevels} />
          <FilterSelect name="category" defaultValue={params?.category || "ALL"} label="All categories" values={options.categories} />
          <button className="h-11 rounded-md bg-primary px-4 text-sm font-bold text-on-primary hover:bg-primary-pressed active:bg-primary-deep">Filter</button>
        </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {books.map((book) => (
          <article key={book.id} className="rounded-lg border border-hairline bg-canvas p-5 shadow-soft">
            <div className="flex gap-4">
              <LibraryCover book={book} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-orange">{book.category}</p>
                <h2 className="mt-2 text-lg font-semibold leading-6 text-ink">{book.title}</h2>
                <p className="mt-1 text-sm text-slate">{book.author || "Unknown author"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[[`${book.id}-subject`, book.subject], [`${book.id}-language`, book.language], [`${book.id}-readingLevel`, book.readingLevel]].map(([key, label]) => (
                    <span key={key} className="rounded-md bg-surface px-2 py-1 text-xs font-semibold text-slate">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate">{book.description}</p>
            <div className="mt-5 flex gap-3">
              <Link href={`/dashboard/library/${book.id}`} className="inline-flex flex-1 justify-center rounded-md bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:bg-primary-pressed active:bg-primary-deep">
                View
              </Link>
              <a href={`/dashboard/library/${book.id}/download`} className="inline-flex flex-1 justify-center rounded-md border border-hairline-strong bg-canvas px-4 py-2 text-sm font-bold text-ink hover:bg-surface">
                Download
              </a>
            </div>
          </article>
        ))}
      </section>

      {books.length === 0 ? <div className="rounded-lg border border-hairline bg-canvas p-8 text-center text-sm text-slate shadow-soft">No library books match the current filters.</div> : null}
    </div>
  );
}

function FilterSelect({ name, defaultValue, values, label }: { name: string; defaultValue: string; values: string[]; label: string }) {
  return (
    <select name={name} defaultValue={defaultValue} className="h-11 rounded-md border border-hairline bg-surface px-3 text-sm text-ink outline-none ring-primary/20 focus:ring-4">
      <option value="ALL">{label}</option>
      {values.map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
    </select>
  );
}
