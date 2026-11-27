"use client";

import { useState } from "react";

export function ShareButtons({ text, url }: { text: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const full = `${text}\n${url}`;
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text, url });
        return;
      } catch {
        /* cancelled: fall through to copy */
      }
    }
    await navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={share} className="btn-primary">
        {copied ? "Copied!" : "Share result"}
      </button>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(full);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="btn-ghost"
      >
        Copy text
      </button>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(full)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-ghost"
      >
        Post on X
      </a>
      <a href={`${url.replace("/r/", "/api/card/")}`} target="_blank" rel="noopener noreferrer" className="btn-ghost">
        Download card
      </a>
    </div>
  );
}
