"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { shareLinks } from "@/lib/share";

const ICONS: Record<string, React.ReactNode> = {
  Facebook: (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9z" />
    </svg>
  ),
  LinkedIn: (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M6.9 8.6H3.9V20h3V8.6zM5.4 3.5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zM20.1 13.4c0-3.1-1.7-4.9-4.2-4.9-1.8 0-2.7 1-3.1 1.7V8.6h-3V20h3v-6c0-1.6.8-2.6 2.1-2.6 1.3 0 2.1.9 2.1 2.6v6h3.1v-6.6z" />
    </svg>
  ),
  X: (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
      <path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" />
    </svg>
  ),
};

/** Opens each network's share dialog in a popup; plus copy-link. */
export function ShareButtons({
  url,
  title,
  copyLabel = "Холбоос хуулах",
  copiedLabel = "Хуулагдлаа",
  size = "md",
}: {
  url: string;
  title: string;
  copyLabel?: string;
  copiedLabel?: string;
  size?: "sm" | "md";
}) {
  const [copied, setCopied] = useState(false);
  const box = size === "sm" ? "size-8" : "size-9";
  const btn = `flex ${box} items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-brand hover:text-brand`;

  const open = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(href, "share", "width=640,height=640,noopener,noreferrer");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt(copyLabel, url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1.5">
      {shareLinks(url, title).map((s) => (
        <a key={s.network} href={s.href} onClick={open(s.href)} target="_blank" rel="noopener noreferrer" title={s.network} aria-label={s.network} className={btn}>
          {ICONS[s.network]}
        </a>
      ))}
      <button type="button" onClick={copy} title={copied ? copiedLabel : copyLabel} aria-label={copyLabel} className={btn}>
        {copied ? <Check className="size-4 text-ok" /> : <Link2 className="size-4" />}
      </button>
    </div>
  );
}
