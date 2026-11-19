"use client";

import { useImageViewer } from "./ImageViewer";

/**
 * Stored rich-text HTML (already sanitized on the server). Tapping a picture opens the full-screen
 * viewer of the surrounding ImageViewerProvider, whose `images` list holds the pictures in document order.
 */
export function RichHtml({ html, className }: { html: string; className?: string }) {
  const open = useImageViewer();
  return (
    <div
      className={className}
      onClick={(e) => {
        const target = e.target;
        if (!open || !(target instanceof HTMLImageElement)) return;
        const index = Array.from(e.currentTarget.querySelectorAll("img")).indexOf(target);
        if (index >= 0) open(index);
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
