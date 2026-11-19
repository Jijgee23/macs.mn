"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Check, Loader2, X } from "lucide-react";

const MAX_SIDE = 1600;

const RATIOS = [
  { label: "Cover 1.91:1", value: 1200 / 630 },
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
  { label: "1:1", value: 1 },
  { label: "3:4", value: 3 / 4 },
] as const;

/**
 * Optional cover crop: drag to move, scroll / pinch / slider to zoom, pick a ratio.
 * Produces a new WebP; the original upload is left untouched.
 */
export function CropDialog({ src, onCancel, onDone }: { src: string; onCancel: () => void; onDone: (file: File) => void | Promise<void> }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ratio, setRatio] = useState<number>(RATIOS[0].value);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  // Load through a blob so the canvas is never tainted and GIFs can be refused up front.
  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    fetch(src)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error("Зураг ачаалж чадсангүй"))))
      .then((blob) => {
        if (cancelled) return;
        if (blob.type === "image/gif") throw new Error("GIF зургийг хайчлах боломжгүй");
        url = URL.createObjectURL(blob);
        setObjectUrl(url);
      })
      .catch((e: Error) => !cancelled && setLoadError(e.message));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [src]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  const onComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  const apply = async () => {
    if (!objectUrl || !area) return;
    setBusy(true);
    try {
      const img = new Image();
      img.src = objectUrl;
      await img.decode();
      const scale = Math.min(1, MAX_SIDE / Math.max(area.width, area.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(area.width * scale);
      canvas.height = Math.round(area.height * scale);
      canvas.getContext("2d")!.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.88));
      if (!blob) throw new Error("Хайчилж чадсангүй");
      await onDone(new File([blob], "cover.webp", { type: "image/webp" }));
    } catch (e) {
      setLoadError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Зураг хайчлах">
      <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-base font-semibold">Зураг хайчлах</h2>
          <button type="button" onClick={onCancel} disabled={busy} title="Хаах" className="rounded-full p-1.5 text-muted hover:bg-soft hover:text-ink">
            <X className="size-4" />
          </button>
        </div>

        <div className="relative h-[55vh] min-h-72 bg-black">
          {objectUrl ? (
            <Cropper
              image={objectUrl}
              crop={crop}
              zoom={zoom}
              aspect={ratio}
              minZoom={1}
              maxZoom={4}
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onComplete}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-white/70">
              {loadError ?? <Loader2 className="size-6 animate-spin" />}
            </div>
          )}
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Харьцаа">
            {RATIOS.map((r) => (
              <button
                key={r.label}
                type="button"
                role="radio"
                aria-checked={ratio === r.value}
                onClick={() => {
                  setRatio(r.value);
                  setCrop({ x: 0, y: 0 });
                  setZoom(1);
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${ratio === r.value ? "border-brand bg-brand-soft text-brand" : "border-line text-muted hover:text-ink"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-3 text-xs text-muted">
            Томруулах
            <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-[var(--brand)]" />
          </label>
          {loadError && objectUrl && <p className="text-xs text-brand">{loadError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} disabled={busy} className="rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-line-strong disabled:opacity-50">
              Болих
            </button>
            <button type="button" onClick={apply} disabled={busy || !area} className="flex items-center gap-2 rounded-full bg-cta px-4 py-2 text-sm font-semibold text-white hover:bg-cta-hover disabled:opacity-50">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Хайчлах
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
