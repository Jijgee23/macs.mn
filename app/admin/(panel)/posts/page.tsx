import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink, ImageIcon, Pencil, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { postUrl, siteOrigin } from "@/lib/share";
import { ShareButtons } from "@/components/ShareButtons";
import { dateFormat, Loading } from "@/components/admin/Requests";
import { DeletePostButton } from "./DeletePostButton";

export const metadata: Metadata = { title: "Нийтлэл" };

const CATEGORY = { NEWS: "Мэдээ", TIP: "Зөвлөмж" } as const;

export default function PostsPage({ searchParams }: PageProps<"/admin/posts">) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Мэдээ, зөвлөмж</h1>
          <p className="mt-1 text-sm text-muted">macs.mn/medee дээр нийтлэгдэнэ. Нийтлэгдсэн нийтлэлийг жагсаалтаас шууд хуваалцана.</p>
        </div>
        <Link href="/admin/posts/new" className="inline-flex items-center gap-1.5 rounded-full bg-cta px-4 py-2 text-sm font-semibold text-white hover:bg-cta-hover">
          <Plus className="size-4" /> Шинэ нийтлэл
        </Link>
      </div>
      <Suspense fallback={<Loading />}>
        <PostList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function PostList({ searchParams }: { searchParams: PageProps<"/admin/posts">["searchParams"] }) {
  await requireAdmin();
  const { category } = await searchParams;
  const filter = category === "NEWS" || category === "TIP" ? category : undefined;

  const posts = await db.post.findMany({
    where: filter ? { category: filter } : undefined,
    orderBy: [{ status: "asc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
    select: { id: true, slug: true, category: true, status: true, titleMn: true, titleEn: true, coverId: true, publishedAt: true, updatedAt: true },
  });
  const origin = siteOrigin();

  const tabs = [
    { label: "Бүгд", href: "/admin/posts", active: !filter },
    { label: "Мэдээ", href: "/admin/posts?category=NEWS", active: filter === "NEWS" },
    { label: "Зөвлөмж", href: "/admin/posts?category=TIP", active: filter === "TIP" },
  ];

  return (
    <>
      <nav className="mt-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className={`rounded-full border px-3.5 py-1.5 text-sm ${t.active ? "border-brand bg-brand-soft text-brand" : "border-line text-muted hover:text-ink"}`}>
            {t.label}
          </Link>
        ))}
      </nav>

      {posts.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line-strong p-10 text-center">
          <p className="text-muted">Нийтлэл алга.</p>
          <Link href="/admin/posts/new" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
            Эхний нийтлэлээ бичих →
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {posts.map((p) => {
            const published = p.status === "PUBLISHED";
            return (
              <li key={p.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <Link href={`/admin/posts/${p.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                  {p.coverId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/media/${p.coverId}`} alt="" className="h-14 w-24 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-soft text-muted">
                      <ImageIcon className="size-5" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p.titleMn}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className={`rounded-full px-2 py-0.5 font-medium ${published ? "bg-ok-soft text-ok" : "bg-soft"}`}>
                        {published ? "Нийтлэгдсэн" : "Ноорог"}
                      </span>
                      <span>{CATEGORY[p.category]}</span>
                      {p.titleEn && <span className="rounded bg-soft px-1.5 font-semibold">EN</span>}
                      <span>{dateFormat.format(p.publishedAt ?? p.updatedAt)}</span>
                    </span>
                  </span>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  {published ? (
                    <>
                      <ShareButtons url={postUrl(origin, p.slug)} title={p.titleMn} size="sm" />
                      <a href={`/medee/${p.slug}`} target="_blank" title="Сайт дээр харах" className="flex size-8 items-center justify-center rounded-full border border-line text-muted hover:border-brand hover:text-brand">
                        <ExternalLink className="size-3.5" />
                      </a>
                    </>
                  ) : (
                    <span className="text-xs text-muted">Нийтэлсний дараа хуваалцана</span>
                  )}
                  <Link href={`/admin/posts/${p.id}`} title="Засах" className="flex size-8 items-center justify-center rounded-full border border-line text-muted hover:border-brand hover:text-brand">
                    <Pencil className="size-3.5" />
                  </Link>
                  <DeletePostButton id={p.id} title={p.titleMn} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
