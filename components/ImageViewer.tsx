"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import type { Locale } from "@/lib/locale";

const LABELS = {
  mn: {
    close: "Хаах",
    prev: "Өмнөх зураг",
    next: "Дараагийн зураг",
    zoom: "Томруулах",
    open: "Зургийг томоор харах",
    viewer: "Зураг харагч",
    go: "Зураг",
  },
  en: {
    close: "Close",
    prev: "Previous image",
    next: "Next image",
    zoom: "Zoom",
    open: "View image full size",
    viewer: "Image viewer",
    go: "Image",
  },
} as const;

type Ctx = { open: (index: number) => void; locale: Locale };
const ViewerContext = createContext<Ctx | null>(null);

/** Opens the surrounding provider's viewer, or does nothing outside one. */
export function useImageViewer() {
  return useContext(ViewerContext)?.open;
}

/**
 * Wrap a page section; every <ViewerImage index={n}> inside opens the same full-screen
 * viewer on `images[n]`, so a cover and a gallery can be flipped through together.
 */
export function ImageViewerProvider({
  images,
  locale,
  children,
}: {
  images: string[];
  locale: Locale;
  children: React.ReactNode;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const open = useCallback((i: number) => setIndex(i), []);
  const ctx = useMemo(() => ({ open, locale }), [open, locale]);
  return (
    <ViewerContext.Provider value={ctx}>
      {children}
      {index !== null && <Viewer images={images} start={index} locale={locale} onClose={() => setIndex(null)} />}
    </ViewerContext.Provider>
  );
}

/** An image that opens the viewer when clicked. Falls back to a plain image outside a provider. */
export function ViewerImage({
  index,
  src,
  alt = "",
  className,
  imgClassName,
  width,
  height,
  priority = false,
}: {
  index: number;
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  /** Intrinsic size: lets the browser reserve the space before the image arrives (no layout shift). */
  width?: number;
  height?: number;
  /** Above-the-fold image: load now, at high priority. */
  priority?: boolean;
}) {
  const ctx = useContext(ViewerContext);
  const l = LABELS[ctx?.locale ?? "mn"];
  return (
    <button
      type="button"
      onClick={() => ctx?.open(index)}
      aria-label={`${l.open}${alt ? `: ${alt}` : ""}`}
      className={`group/viewer relative block cursor-zoom-in ${className ?? ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={imgClassName}
      />
      <span className="pointer-events-none absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur transition-opacity group-hover/viewer:opacity-100 group-focus-visible/viewer:opacity-100">
        <ZoomIn className="size-4" aria-hidden />
      </span>
    </button>
  );
}

const SWIPE_PX = 50;

function Viewer({
  images,
  start,
  locale,
  onClose,
}: {
  images: string[];
  start: number;
  locale: Locale;
  onClose: () => void;
}) {
  const l = LABELS[locale];
  const count = images.length;
  const [index, setIndex] = useState(start);
  const [zoomed, setZoomed] = useState<{ x: number; y: number } | null>(null);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const closeRef = useRef<HTMLButtonElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback(
    (to: number) => {
      setZoomed(null);
      setIndex(((to % count) + count) % count);
    },
    [count],
  );

  // Lock page scroll and restore focus to whatever opened the viewer.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        // Keep focus inside the dialog.
        const items = document.querySelectorAll<HTMLElement>("[data-viewer] button");
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      const action: Record<string, () => void> = {
        Escape: onClose,
        ArrowRight: () => go(index + 1),
        ArrowLeft: () => go(index - 1),
        Home: () => go(0),
        End: () => go(count - 1),
      };
      if (!action[e.key]) return;
      e.preventDefault();
      action[e.key]();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, count, go, onClose]);

  // Warm the neighbours so flipping feels instant.
  useEffect(() => {
    for (const i of [index + 1, index - 1]) {
      const src = images[((i % count) + count) % count];
      if (src) new Image().src = src;
    }
  }, [index, images, count]);

  // Keep the active thumbnail in view.
  useEffect(() => {
    stripRef.current
      ?.querySelector<HTMLElement>(`[data-i="${index}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [index]);

  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const t = touch.current;
    touch.current = null;
    if (!t || zoomed) return;
    const dx = e.changedTouches[0].clientX - t.x;
    const dy = e.changedTouches[0].clientY - t.y;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1));
    else if (dy > SWIPE_PX * 2 && Math.abs(dy) > Math.abs(dx) * 1.5) onClose();
  };

  const toggleZoom = (e: React.MouseEvent<HTMLImageElement>) => {
    e.stopPropagation();
    if (zoomed) return setZoomed(null);
    const r = e.currentTarget.getBoundingClientRect();
    setZoomed({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };
  const moveZoom = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!zoomed) return;
    const r = e.currentTarget.getBoundingClientRect();
    setZoomed({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  const nav =
    "absolute top-1/2 z-10 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 sm:flex";

  return (
    <div
      data-viewer
      role="dialog"
      aria-modal="true"
      aria-label={l.viewer}
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-md"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium tabular-nums" aria-live="polite">
          {index + 1} / {count}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={l.close}
          className="flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label={l.prev}
              className={`${nav} left-4`}
              onClick={(e) => {
                e.stopPropagation();
                go(index - 1);
              }}
            >
              <ChevronLeft className="size-6" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={l.next}
              className={`${nav} right-4`}
              onClick={(e) => {
                e.stopPropagation();
                go(index + 1);
              }}
            >
              <ChevronRight className="size-6" aria-hidden />
            </button>
          </>
        )}
        <div className={`flex size-full items-center justify-center ${zoomed ? "overflow-hidden" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={index}
            src={images[index]}
            alt=""
            draggable={false}
            onLoad={() => setLoaded((s) => ({ ...s, [index]: true }))}
            onClick={toggleZoom}
            onMouseMove={moveZoom}
            style={zoomed ? { transform: "scale(2.2)", transformOrigin: `${zoomed.x}% ${zoomed.y}%` } : undefined}
            className={`max-h-full max-w-full rounded-lg object-contain shadow-2xl transition-[transform,opacity] duration-200 select-none ${loaded[index] ? "opacity-100" : "opacity-0"} ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
          />
        </div>
      </div>

      {count > 1 && (
        <div
          ref={stripRef}
          className="flex justify-start gap-2 overflow-x-auto px-4 py-3 sm:justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              data-i={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`${l.go} ${i + 1}`}
              aria-current={i === index}
              className={`size-14 shrink-0 overflow-hidden rounded-lg border-2 bg-white/5 transition-all sm:size-16 ${i === index ? "border-white opacity-100" : "border-transparent opacity-50 hover:opacity-90"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
