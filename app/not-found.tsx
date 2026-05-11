import Link from "next/link";
import { FileQuestion } from "lucide-react";

/**
 * Custom 404 page.
 * Rendered by Next.js when notFound() is called or a route doesn't exist.
 */
export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-surface-soft">
          <FileQuestion className="h-8 w-8 text-stone" aria-hidden="true" />
        </div>

        <p className="text-sm font-semibold uppercase tracking-widest text-stone">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Page not found</h1>
        <p className="mt-3 text-sm text-slate">
          The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
        </p>

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center rounded-md bg-ink-deep px-5 text-sm font-medium text-on-dark hover:bg-charcoal"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
