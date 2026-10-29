"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from "lucide-react";
import { saveSection } from "@/app/admin/actions";
import { fieldLabels } from "@/content/admin-labels";
import { phoneKinds } from "@/content/common";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
type Path = (string | number)[];

/** "mn"/"en" side by side for translated sections, or "all" for language-independent ones. */
type Values = Partial<Record<"mn" | "en" | "all", Json>>;

const LOCALE_TITLES = { mn: "Монгол", en: "English", all: "" } as const;

const labelFor = (key: string | number) => (typeof key === "number" ? `#${key + 1}` : (fieldLabels[key] ?? key));

function getAt(value: Json, path: Path): Json {
  return path.reduce<Json>((v, k) => (v as Record<string | number, Json>)?.[k] ?? null, value);
}

function setAt(value: Json, path: Path, next: Json): Json {
  if (path.length === 0) return next;
  const [head, ...rest] = path;
  const copy = (Array.isArray(value) ? [...value] : { ...(value as object) }) as Record<string | number, Json>;
  copy[head] = setAt(copy[head], rest, next);
  return copy as Json;
}

/** An empty copy of an existing list item, used for "add row". Enum-like "kind" keeps its value. */
function blank(value: Json, key?: string | number): Json {
  if (key === "kind") return value;
  if (typeof value === "string") return "";
  if (typeof value === "number") return 0;
  if (Array.isArray(value)) return value.length ? [blank(value[0])] : [];
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, blank(v, k)]));
  }
  return value;
}

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none transition-shadow focus:border-brand focus:ring-4 focus:ring-brand/10 aria-invalid:border-brand aria-invalid:bg-brand-soft/40";

export function ContentEditor({
  sectionKey,
  initial,
  updatedAt,
  updatedBy,
}: {
  sectionKey: string;
  initial: Values;
  updatedAt?: string | null;
  updatedBy?: string | null;
}) {
  const locales = (Object.keys(initial) as (keyof Values)[]).filter((l) => initial[l] !== undefined);
  const [values, setValues] = useState<Values>(initial);
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; errors?: string[]; savedAt?: string } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const change = (updater: (v: Values) => Values) => {
    setValues(updater);
    setDirty(true);
    setResult(null);
  };

  const setLeaf = (locale: keyof Values, path: Path, next: Json) =>
    change((v) => ({ ...v, [locale]: setAt(v[locale] as Json, path, next) }));

  /** List edits apply to every locale so MN and EN rows stay aligned. */
  const editList = (path: Path, edit: (list: Json[]) => Json[]) =>
    change((v) => {
      const out: Values = { ...v };
      for (const l of locales) out[l] = setAt(v[l] as Json, path, edit([...((getAt(v[l] as Json, path) as Json[]) ?? [])]));
      return out;
    });

  const save = () =>
    startTransition(async () => {
      const res = await saveSection(sectionKey, JSON.stringify(values));
      setResult(res);
      if (res.ok) setDirty(false);
    });

  function renderLeaf(path: Path, key: string | number | undefined) {
    const sample = getAt(values[locales[0]] as Json, path);

    if (key === "kind") {
      return (
        <div className={`grid gap-3 ${locales.length > 1 ? "md:grid-cols-2" : ""}`}>
          <select
            value={String(sample)}
            onChange={(e) => locales.forEach((l) => setLeaf(l, path, e.target.value))}
            className={`${inputClass} md:max-w-xs`}
          >
            {phoneKinds.map((k) => (
              <option key={k} value={k}>
                {fieldLabels[k] ?? k}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div className={`grid gap-3 ${locales.length > 1 ? "md:grid-cols-2" : ""}`}>
        {locales.map((l) => {
          const v = getAt(values[l] as Json, path);
          if (typeof v === "number") {
            return (
              <input
                key={l}
                type="number"
                value={v}
                onChange={(e) => setLeaf(l, path, Number(e.target.value))}
                className={`${inputClass} md:max-w-xs`}
              />
            );
          }
          const str = String(v ?? "");
          const long = locales.some((x) => String(getAt(values[x] as Json, path) ?? "").length > 70);
          const common = {
            value: str,
            lang: l === "all" ? undefined : l,
            "aria-label": `${labelFor(key ?? "")} ${LOCALE_TITLES[l]}`.trim(),
            "aria-invalid": str.trim() === "",
            className: inputClass,
          };
          return long ? (
            <textarea key={l} rows={3} {...common} onChange={(e) => setLeaf(l, path, e.target.value)} />
          ) : (
            <input key={l} {...common} onChange={(e) => setLeaf(l, path, e.target.value)} />
          );
        })}
      </div>
    );
  }

  function rowControls(path: Path, index: number, length: number) {
    const btn = "flex size-7 items-center justify-center rounded-md text-muted hover:bg-soft hover:text-ink disabled:opacity-30";
    const move = (to: number) =>
      editList(path, (list) => {
        const [item] = list.splice(index, 1);
        list.splice(to, 0, item);
        return list;
      });
    return (
      <div className="flex shrink-0 items-center gap-0.5">
        <button type="button" className={btn} disabled={index === 0} onClick={() => move(index - 1)} title="Дээш">
          <ArrowUp className="size-3.5" />
        </button>
        <button type="button" className={btn} disabled={index === length - 1} onClick={() => move(index + 1)} title="Доош">
          <ArrowDown className="size-3.5" />
        </button>
        <button
          type="button"
          className={`${btn} hover:text-brand`}
          onClick={() => editList(path, (list) => list.filter((_, i) => i !== index))}
          title="Устгах"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    );
  }

  function renderNode(path: Path, key?: string | number): React.ReactNode {
    const sample = getAt(values[locales[0]] as Json, path);

    if (Array.isArray(sample)) {
      return (
        <fieldset className="space-y-2">
          {key !== undefined && <legend className="mb-2 text-sm font-semibold">{labelFor(key)}</legend>}
          {sample.map((item, i) =>
            typeof item === "object" && item !== null ? (
              <div key={i} className="rounded-xl border border-line bg-soft/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted">#{i + 1}</span>
                  {rowControls(path, i, sample.length)}
                </div>
                {renderNode([...path, i])}
              </div>
            ) : (
              <div key={i} className="flex items-start gap-2">
                <span className="w-6 pt-2 text-right text-xs text-muted">{i + 1}</span>
                <div className="flex-1">{renderLeaf([...path, i], i)}</div>
                {rowControls(path, i, sample.length)}
              </div>
            ),
          )}
          <button
            type="button"
            onClick={() => editList(path, (list) => [...list, list.length ? blank(list[list.length - 1]) : ""])}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line-strong px-3 py-1.5 text-sm text-muted hover:border-brand hover:text-brand"
          >
            <Plus className="size-3.5" /> Мөр нэмэх
          </button>
        </fieldset>
      );
    }

    if (sample && typeof sample === "object") {
      const children = Object.keys(sample).map((k) => <div key={k}>{renderNode([...path, k], k)}</div>);
      if (key === undefined || typeof key === "number") return <div className="space-y-4">{children}</div>;
      return (
        <fieldset className="space-y-4 rounded-xl border border-line p-4">
          <legend className="px-1 text-sm font-semibold">{labelFor(key)}</legend>
          {children}
        </fieldset>
      );
    }

    return (
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">{labelFor(key ?? "")}</span>
        {renderLeaf(path, key)}
      </label>
    );
  }

  return (
    <div>
      {locales.length > 1 && (
        <div className="sticky top-[7.25rem] z-10 -mx-1 mb-4 hidden grid-cols-2 gap-3 bg-bg/90 px-1 py-2 text-xs font-semibold tracking-wide text-muted uppercase backdrop-blur md:grid">
          <span>MN · {LOCALE_TITLES.mn}</span>
          <span>EN · {LOCALE_TITLES.en}</span>
        </div>
      )}

      {renderNode([])}

      <div className="sticky bottom-0 mt-8 flex flex-wrap items-center gap-4 border-t border-line bg-bg/95 py-4 backdrop-blur">
        <button
          type="button"
          onClick={save}
          disabled={pending || !dirty}
          className="rounded-full bg-cta px-6 py-2.5 text-sm font-semibold text-white hover:bg-cta-hover disabled:opacity-50"
        >
          {pending ? "Хадгалж байна…" : "Хадгалах"}
        </button>
        {result?.ok && (
          <span className="inline-flex items-center gap-1.5 text-sm text-ok" role="status">
            <Check className="size-4" /> Хадгалагдлаа — сайт дээр шинэчлэгдсэн
          </span>
        )}
        {!result && dirty && <span className="text-sm text-muted">Хадгалаагүй өөрчлөлт байна</span>}
        {!result && !dirty && updatedAt && (
          <span className="text-sm text-muted">
            Сүүлд: {new Date(updatedAt).toLocaleString("mn-MN")} {updatedBy ? `· ${updatedBy}` : ""}
          </span>
        )}
      </div>

      {result && !result.ok && (
        <div className="mb-6 rounded-xl border border-brand-line bg-brand-soft p-4 text-sm text-brand" role="alert">
          <p className="font-semibold">Хадгалсангүй:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {result.errors?.slice(0, 12).map((e) => <li key={e}>{e}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
