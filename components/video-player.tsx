"use client";

import { AlertCircle, ExternalLink, PlayCircle } from "lucide-react";
import { useState } from "react";

export function VideoPlayer({ title, providerLabel, embedUrl, externalUrl, posterUrl, privateVideo = false }: { title: string; providerLabel: string; embedUrl?: string | null; externalUrl?: string | null; posterUrl?: string; privateVideo?: boolean }) {
  const [embedFailed, setEmbedFailed] = useState(false);

  if (privateVideo) {
    return (
      <video controls className="aspect-video w-full bg-brand-navy" poster={posterUrl}>
        {externalUrl ? <source src={externalUrl} /> : null}
        Your browser cannot play this uploaded video.
      </video>
    );
  }

  if (embedUrl && !embedFailed) {
    return (
      <div className="bg-brand-navy">
        <iframe
          title={`${title} video lesson`}
          src={embedUrl}
          className="aspect-video w-full bg-brand-navy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onError={() => setEmbedFailed(true)}
        />
        {externalUrl ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-on-dark/10 bg-brand-navy px-4 py-3 text-sm text-on-dark/80">
            <span>If the embedded player is blocked by your network, open the lesson directly.</span>
            <a className="inline-flex items-center gap-2 rounded-md bg-on-dark px-3 py-2 text-sm font-semibold text-brand-navy hover:bg-on-dark/90" href={externalUrl} target="_blank" rel="noreferrer">
              Open video on {providerLabel}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        ) : null}
      </div>
    );
  }

  return <VideoFallback title={title} providerLabel={providerLabel} externalUrl={externalUrl} blocked={Boolean(embedUrl && embedFailed)} />;
}

function VideoFallback({ title, providerLabel, externalUrl, blocked }: { title: string; providerLabel: string; externalUrl?: string | null; blocked?: boolean }) {
  return (
    <div className="flex aspect-video w-full items-center justify-center bg-surface p-xl text-center">
      <div className="max-w-md rounded-lg border border-hairline bg-canvas p-xl shadow-card">
        {blocked ? <PlayCircle className="mx-auto h-10 w-10 text-primary" aria-hidden="true" /> : <AlertCircle className="mx-auto h-10 w-10 text-error" aria-hidden="true" />}
        <h2 className="mt-3 text-lg font-semibold text-ink">{blocked ? "Embedded player is blocked" : "Video link needs attention"}</h2>
        <p className="mt-2 text-sm leading-6 text-slate">
          {blocked ? `The ${providerLabel} player could not load here. You can still open “${title}” in a new tab.` : `This ${providerLabel} link could not be converted into a playable embed. Check the saved URL and try again.`}
        </p>
        {externalUrl ? (
          <a className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-bold text-on-primary hover:bg-primary-pressed" href={externalUrl} target="_blank" rel="noreferrer">
            Open video on {providerLabel}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
