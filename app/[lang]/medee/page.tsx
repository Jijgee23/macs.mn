import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getContent, getContentFor } from "@/lib/content";
import { listPosts } from "@/lib/posts";
import { isLocale, localeHref, type Locale } from "@/lib/locale";
import type { SiteContent } from "@/content/schema";
import { PostCard } from "@/components/PostCard";

export async function generateMetadata({ params }: PageProps<"/[lang]/medee">): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : "mn";
  const t = await getContentFor(locale);
  return {
    title: t.news.title,
    description: t.news.intro,
    alternates: { canonical: localeHref(locale, "/medee"), languages: { mn: "/medee", en: "/en/medee" } },
  };
}

export default async function NewsPage({ searchParams }: PageProps<"/[lang]/medee">) {
  const { locale, t } = await getContent();
  return (
    <div className="container-wide py-14 sm:py-20">
      <p className="text-sm font-semibold text-brand">{t.news.eyebrow}</p>
      <h1 className="mt-2 text-4xl font-bold tracking-[-0.03em] text-balance sm:text-5xl">{t.news.title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted text-pretty">{t.news.intro}</p>
      <Suspense fallback={<PostGridSkeleton />}>
        <PostGrid locale={locale} t={t} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function PostGrid({
  locale,
  t,
  searchParams,
}: {
  locale: Locale;
  t: SiteContent;
  searchParams: PageProps<"/[lang]/medee">["searchParams"];
}) {
  const { category } = await searchParams;
  const filter = category === "zovlomj" ? "TIP" : category === "medee" ? "NEWS" : undefined;
  const posts = await listPosts(locale, filter);
  const base = localeHref(locale, "/medee");

  const tabs = [
    { label: t.news.all, href: base, active: !filter },
    { label: t.news.newsLabel, href: `${base}?category=medee`, active: filter === "NEWS" },
    { label: t.news.tipLabel, href: `${base}?category=zovlomj`, active: filter === "TIP" },
  ];

  return (
    <>
      <nav className="mt-8 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${tab.active ? "border-ink bg-ink text-bg" : "border-line text-muted hover:text-ink"}`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {posts.length === 0 ? (
        <p className="mt-16 text-center text-muted">{t.news.empty}</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {posts.map((p) => (
            <PostCard
              key={p.slug}
              post={p}
              href={localeHref(locale, `/medee/${p.slug}`)}
              categoryLabel={p.category === "TIP" ? t.news.tipLabel : t.news.newsLabel}
              readMore={t.news.readMore}
              dateLocale={locale === "en" ? "en-GB" : "mn-MN"}
            />
          ))}
        </div>
      )}
    </>
  );
}

function PostGridSkeleton() {
  return (
    <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-80 animate-pulse rounded-2xl bg-soft" />
      ))}
    </div>
  );
}
