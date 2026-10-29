import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fallbackContent } from "@/lib/content";
import { adminSections } from "@/content/admin-labels";
import { defaultContactInfo } from "@/content/common";
import type { SectionKey } from "@/content/schema";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { Loading } from "@/components/admin/Requests";

export const metadata: Metadata = { title: "Контент засах" };

/**
 * Postgres jsonb doesn't keep key order, so put object keys back in the order of the
 * built-in content (which matches the page) before handing them to the editor.
 */
function orderLike(value: unknown, template: unknown): unknown {
  if (Array.isArray(value)) {
    const item = Array.isArray(template) ? template[0] : undefined;
    return value.map((v) => orderLike(v, item));
  }
  if (value && typeof value === "object" && template && typeof template === "object" && !Array.isArray(template)) {
    const v = value as Record<string, unknown>;
    const t = template as Record<string, unknown>;
    const keys = [...Object.keys(t).filter((k) => k in v), ...Object.keys(v).filter((k) => !(k in t))];
    return Object.fromEntries(keys.map((k) => [k, orderLike(v[k], t[k])]));
  }
  return value;
}

export default function EditSectionPage({ params }: PageProps<"/admin/content/[section]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/content/[section]">["params"] }) {
  await requireAdmin();
  const { section } = await params;
  const meta = adminSections.find((s) => s.key === section);
  if (!meta) notFound();

  const rows = await db.contentSection.findMany({ where: { key: section } });
  const row = (locale: string) => rows.find((r) => r.locale === locale);
  const latest = rows.toSorted((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

  // Sections not yet in the database start from the built-in text.
  const initial =
    section === "contact"
      ? { all: orderLike(row("all")?.data ?? defaultContactInfo, defaultContactInfo) }
      : {
          mn: orderLike(row("mn")?.data ?? fallbackContent.mn[section as SectionKey], fallbackContent.mn[section as SectionKey]),
          en: orderLike(row("en")?.data ?? fallbackContent.en[section as SectionKey], fallbackContent.mn[section as SectionKey]),
        };

  return (
    <>
      <Link href="/admin/content" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-3.5" /> Контент
      </Link>
      <div className="mt-3 mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{meta.title}</h1>
          <p className="mt-1 text-sm text-muted">{meta.description}</p>
        </div>
        {meta.page && (
          <div className="flex gap-3 text-sm">
            <a href={meta.page} target="_blank" className="inline-flex items-center gap-1 text-brand hover:underline">
              MN <ExternalLink className="size-3.5" />
            </a>
            <a
              href={meta.page === "/" ? "/en" : `/en${meta.page}`.replace("/en/#", "/en#")}
              target="_blank"
              className="inline-flex items-center gap-1 text-brand hover:underline"
            >
              EN <ExternalLink className="size-3.5" />
            </a>
          </div>
        )}
      </div>
      <ContentEditor
        key={section}
        sectionKey={section}
        initial={JSON.parse(JSON.stringify(initial))}
        updatedAt={latest?.updatedAt.toISOString() ?? null}
        updatedBy={latest?.updatedBy ?? null}
      />
    </>
  );
}
