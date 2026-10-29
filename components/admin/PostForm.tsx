"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, ImagePlus, Loader2, X } from "lucide-react";
import { savePost, type PostInput } from "@/app/admin/posts-actions";
import { slugify } from "@/lib/slug";
import { RichEditor } from "./RichEditor";
import { uploadImage } from "./upload";
import { adminInput } from "./styles";

type Tab = "mn" | "en";

export function PostForm({ id, initial }: { id: string | null; initial: PostInput }) {
  const router = useRouter();
  const [post, setPost] = useState<PostInput>(initial);
  const [slugTouched, setSlugTouched] = useState(id !== null);
  const [tab, setTab] = useState<Tab>("mn");
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; errors?: string[] } | null>(null);
  const [pending, startTransition] = useTransition();
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof PostInput>(key: K, value: PostInput[K]) => {
    setPost((p) => {
      const next = { ...p, [key]: value };
      if (key === "titleMn" && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
    setDirty(true);
    setResult(null);
  };

  const save = (status: PostInput["status"]) =>
    startTransition(async () => {
      const res = await savePost(id, { ...post, status });
      setResult(res);
      if (res.ok) {
        setDirty(false);
        setPost((p) => ({ ...p, status }));
        if (!id && res.id) router.replace(`/admin/posts/${res.id}`);
        else router.refresh();
      }
    });

  const onCover = async (file: File | undefined) => {
    if (!file) return;
    setCoverBusy(true);
    setCoverError(null);
    try {
      const { id: mediaId } = await uploadImage(file);
      set("coverId", mediaId);
    } catch (e) {
      setCoverError((e as Error).message);
    } finally {
      setCoverBusy(false);
      if (coverInput.current) coverInput.current.value = "";
    }
  };

  const published = post.status === "PUBLISHED";

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-5">
        <div className="flex gap-1 border-b border-line" role="tablist">
          {(["mn", "en"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === t ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink"}`}
            >
              {t === "mn" ? "Монгол" : "English"}
              {t === "en" && <span className="ml-1.5 font-normal text-muted">{post.titleEn ? "✓" : "(заавал биш)"}</span>}
            </button>
          ))}
        </div>

        {tab === "mn" ? (
          <>
            <Field label="Гарчиг" required>
              <input value={post.titleMn} onChange={(e) => set("titleMn", e.target.value)} className={`${adminInput} text-base font-semibold`} maxLength={200} lang="mn" />
            </Field>
            <Field label="Товч тайлбар" hint="Жагсаалт, Facebook-д харагдана. Хоосон бол агуулгын эхнээс авна.">
              <textarea value={post.excerptMn} onChange={(e) => set("excerptMn", e.target.value)} rows={2} maxLength={400} className={adminInput} lang="mn" />
            </Field>
            <Field label="Агуулга" required>
              <RichEditor key="mn" lang="mn" value={post.bodyMn} onChange={(v) => set("bodyMn", v)} />
            </Field>
          </>
        ) : (
          <>
            <p className="rounded-lg bg-soft px-3 py-2 text-sm text-muted">
              Англи гарчиг бөглөсөн нийтлэл л macs.mn/en дээр гарна.
            </p>
            <Field label="Title">
              <input value={post.titleEn} onChange={(e) => set("titleEn", e.target.value)} className={`${adminInput} text-base font-semibold`} maxLength={200} lang="en" />
            </Field>
            <Field label="Excerpt" hint="Empty = first lines of the content.">
              <textarea value={post.excerptEn} onChange={(e) => set("excerptEn", e.target.value)} rows={2} maxLength={400} className={adminInput} lang="en" />
            </Field>
            <Field label="Content">
              <RichEditor key="en" lang="en" value={post.bodyEn} onChange={(v) => set("bodyEn", v)} />
            </Field>
          </>
        )}
      </div>

      <aside className="space-y-5 xl:sticky xl:top-[8rem] xl:self-start">
        <div className="space-y-4 rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Төлөв</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${published ? "bg-ok-soft text-ok" : "bg-soft text-muted"}`}>
              {published ? "Нийтлэгдсэн" : "Ноорог"}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <button type="button" disabled={pending} onClick={() => save("PUBLISHED")} className="flex items-center justify-center gap-2 rounded-full bg-cta px-4 py-2.5 text-sm font-semibold text-white hover:bg-cta-hover disabled:opacity-50">
              {pending && <Loader2 className="size-4 animate-spin" />}
              {published ? "Хадгалах" : "Нийтлэх"}
            </button>
            <button type="button" disabled={pending} onClick={() => save("DRAFT")} className="rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-line-strong disabled:opacity-50">
              {published ? "Нийтлэлийг буцаах (ноорог)" : "Ноорог хадгалах"}
            </button>
          </div>
          {result?.ok && (
            <p className="flex items-center gap-1.5 text-sm text-ok" role="status">
              <Check className="size-4" /> Хадгалагдлаа
            </p>
          )}
          {!result && dirty && <p className="text-xs text-muted">Хадгалаагүй өөрчлөлт байна</p>}
          {result && !result.ok && (
            <ul className="list-disc space-y-1 rounded-lg bg-brand-soft py-2 pr-2 pl-6 text-sm text-brand" role="alert">
              {result.errors?.map((e) => <li key={e}>{e}</li>)}
            </ul>
          )}
          {id && published && (
            <a href={`/medee/${post.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-brand hover:underline">
              Сайт дээр харах <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-line bg-surface p-5">
          <Field label="Ангилал">
            <div className="grid grid-cols-2 gap-2">
              {(["NEWS", "TIP"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("category", c)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${post.category === c ? "border-brand bg-brand-soft text-brand" : "border-line text-muted hover:text-ink"}`}
                >
                  {c === "NEWS" ? "Мэдээ" : "Зөвлөмж"}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Cover зураг" hint="Жагсаалт, нийтлэлийн дээд хэсэг, Facebook share-д харагдана. 1200×630 орчим хэвтээ зураг тохиромжтой.">
            {post.coverId ? (
              <div className="relative overflow-hidden rounded-lg border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/media/${post.coverId}`} alt="" className="aspect-[1200/630] w-full object-cover" />
                <button type="button" onClick={() => set("coverId", null)} title="Зураг авах" className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80">
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInput.current?.click()}
                disabled={coverBusy}
                className="flex aspect-[1200/630] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong text-sm text-muted hover:border-brand hover:text-brand"
              >
                {coverBusy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
                {coverBusy ? "Хуулж байна…" : "Зураг сонгох"}
              </button>
            )}
            <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => onCover(e.target.files?.[0])} />
            {coverError && <p className="mt-1 text-xs text-brand">{coverError}</p>}
          </Field>

          <Field label="Slug (хаяг)" hint={`macs.mn/medee/${post.slug || "…"}`}>
            <input
              value={post.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
              }}
              className={`${adminInput} font-mono text-xs`}
              maxLength={80}
            />
          </Field>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="text-brand"> *</span>}
      </span>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
