import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { getContent } from "@/lib/content";
import { getPost, hasMnPost } from "@/lib/posts";
import { isLocale, localeHref, type Locale } from "@/lib/locale";
import { postUrl, siteOrigin } from "@/lib/share";
import type { SiteContent } from "@/content/schema";
import { ShareButtons } from "@/components/ShareButtons";

export async function generateMetadata({ params }: PageProps<"/[lang]/medee/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = isLocale(lang) ? lang : "mn";
  const post = await getPost(slug, locale);
  // Throwing here (not only in the streamed body) makes the response a real 404.
  if (!post) {
    if (locale === "en" && (await hasMnPost(slug))) return { robots: { index: false } };
    notFound();
  }
  const origin = siteOrigin();
  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: localeHref(locale, `/medee/${slug}`),
      languages: post.hasEn ? { mn: `/medee/${slug}`, en: `/en/medee/${slug}` } : { mn: `/medee/${slug}` },
    },
    openGraph: {
      type: "article",
      url: postUrl(origin, slug, locale),
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      images: post.cover ? [{ url: `${origin}${post.cover}`, alt: post.title }] : undefined,
    },
    twitter: { card: post.cover ? "summary_large_image" : "summary" },
  };
}

export default async function PostPage({ params }: PageProps<"/[lang]/medee/[slug]">) {
  const { locale, t } = await getContent();
  return (
    <Suspense fallback={<div className="container-wide min-h-[60vh] py-20" />}>
      <Post locale={locale} t={t} params={params} />
    </Suspense>
  );
}

async function Post({ locale, t, params }: { locale: Locale; t: SiteContent; params: PageProps<"/[lang]/medee/[slug]">["params"] }) {
  const { slug } = await params;
  const post = await getPost(slug, locale);

  if (!post) {
    // On /en, a post that only exists in Mongolian points there instead of a bare 404.
    if (locale === "en" && (await hasMnPost(slug))) {
      return (
        <div className="container-wide py-24 text-center">
          <p className="text-lg text-muted">{t.news.onlyInMongolian}</p>
          <Link href={`/medee/${slug}`} hrefLang="mn" className="mt-4 inline-block font-semibold text-brand hover:underline">
            /medee/{slug} →
          </Link>
        </div>
      );
    }
    notFound();
  }

  const date = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "mn-MN", { dateStyle: "long", timeZone: "Asia/Ulaanbaatar" }).format(new Date(post.publishedAt));
  const url = postUrl(siteOrigin(), slug, locale);

  return (
    <article className="container-wide py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link href={localeHref(locale, "/medee")} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-3.5" /> {t.news.back}
        </Link>
        <p className="mt-6 flex items-center gap-2 text-sm">
          <span className={`rounded-full px-2.5 py-0.5 font-semibold ${post.category === "TIP" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-brand-soft text-brand"}`}>
            {post.category === "TIP" ? t.news.tipLabel : t.news.newsLabel}
          </span>
          <time dateTime={post.publishedAt} className="text-muted">
            {date}
          </time>
        </p>
        <h1 className="mt-4 text-3xl leading-tight font-bold tracking-[-0.02em] text-balance sm:text-5xl">{post.title}</h1>
        {post.excerpt && <p className="mt-4 text-lg text-muted text-pretty">{post.excerpt}</p>}
      </div>

      {post.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover} alt="" className="mx-auto mt-8 aspect-[1200/630] w-full max-w-5xl rounded-2xl object-cover" />
      )}

      <div className="mx-auto mt-10 max-w-3xl">
        <div className="rich" dangerouslySetInnerHTML={{ __html: post.body }} />
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <span className="text-sm font-semibold">{t.news.share}</span>
          <ShareButtons url={url} title={post.title} copyLabel={t.news.copyLink} copiedLabel={t.news.copied} />
        </div>
      </div>
    </article>
  );
}
