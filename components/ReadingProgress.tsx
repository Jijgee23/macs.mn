"use client";

import { useEffect, useRef } from "react";

/** Thin bar at the top of the window showing how far down the article the reader is. */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = target.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const done = Math.min(1, Math.max(0, total > 0 ? -rect.top / total : 0));
      if (bar.current) bar.current.style.transform = `scaleX(${done})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [targetId]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5">
      <div ref={bar} className="h-full origin-left scale-x-0 bg-brand will-change-transform" />
    </div>
  );
}
