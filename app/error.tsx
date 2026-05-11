"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Route-level error boundary.
 * Rendered when an unhandled error occurs in a route segment.
 * Does NOT catch errors in the root layout — use global-error.tsx for that.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to the browser console in development; in production a real
    // error monitoring service (Sentry, etc.) would be wired here.
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-tint-rose">
          <AlertTriangle className="h-8 w-8 text-error" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-semibold text-ink">Something went wrong</h1>
        <p className="mt-3 text-sm text-slate">
          An unexpected error occurred. If this keeps happening, please contact your school
          administrator.
        </p>

        {/* Show digest in development to help match server-side logs */}
        {error.digest && process.env.NODE_ENV !== "production" && (
          <p className="mt-2 font-mono text-xs text-stone">
            Digest: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center rounded-md bg-ink-deep px-5 text-sm font-medium text-on-dark hover:bg-charcoal"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center rounded-md border border-hairline px-5 text-sm font-medium text-charcoal hover:bg-surface-soft"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
