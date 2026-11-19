import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { getContent } from "@/lib/content";
import { getPost, hasMnPost, listPosts } from "@/lib/posts";
import { isLocale, localeHref, type Locale } from "@/lib/locale";
import { postUrl, siteOrigin } from "@/lib/share";
import type { SiteContent } from "@/content/schema";
import { ShareButtons } from "@/components/ShareButtons";
import { ImageViewerProvider, ViewerImage } from "@/components/ImageViewer";
import { ReadingProgress } from "@/components/ReadingProgress";
import type { Appearance } from "@/lib/post-appearance";

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
    <Suspense
      fallback={
        <div className="container-wide animate-pulse py-14" aria-hidden>
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="h-4 w-24 rounded-full bg-soft" />
            <div className="h-10 w-full rounded-lg bg-soft" />
            <div className="h-10 w-2/3 rounded-lg bg-soft" />
            <div className="h-5 w-4/5 rounded-lg bg-soft" />
          </div>
          <div className="mx-auto mt-8 aspect-[1200/630] max-w-5xl rounded-2xl bg-soft" />
        </div>
      }
    >
      <Post locale={locale} t={t} params={params} />
    </Suspense>
  );
}

const WIDTH: Record<Appearance["width"], string> = { narrow: "max-w-2xl", normal: "max-w-3xl", wide: "max-w-4xl" };
const TEXT: Record<Appearance["text"], string> = { sm: "rich-sm", md: "", lg: "rich-lg" };

async function Post({
  locale,
  t,
  params,
}: {
  locale: Locale;
  t: SiteContent;
  params: PageProps<"/[lang]/medee/[slug]">["params"];
}) {
  const { slug } = await params;
  const post = await getPost(slug, locale);

  if (!post) {
    // On /en, a post that only exists in Mongolian points there instead of a bare 404.
    if (locale === "en" && (await hasMnPost(slug))) {
      return (
        <div className="container-wide py-24 text-center">
          <p className="text-lg text-muted">{t.news.onlyInMongolian}</p>
          <Link
            href={`/medee/${slug}`}
            hrefLang="mn"
            className="mt-4 inline-block font-semibold text-brand hover:underline"
          >
            /medee/{slug} →
          </Link>
        </div>
      );
    }
    notFound();
  }

  const date = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "mn-MN", {
    dateStyle: "long",
    timeZone: "Asia/Ulaanbaatar",
  }).format(new Date(post.publishedAt));
  const url = postUrl(siteOrigin(), slug, locale);

  const related = (await listPosts(locale, undefined, 4)).filter((p) => p.slug !== slug).slice(0, 3);
  const look = post.appearance;
  const left = look.header === "left";
  const col = WIDTH[look.width];
  // A hidden cover is left out of the full-screen viewer too, so indexes stay aligned.
  const showCover = !!post.cover && look.cover !== "hidden";
  const images = [...(showCover ? [post.cover!] : []), ...post.gallery];
  const galleryOffset = showCover ? 1 : 0;

  return (
    <ImageViewerProvider images={images} locale={locale}>
      {look.progress && <ReadingProgress targetId="post-article" />}
      <article id="post-article" className="container-wide py-10 sm:py-14">
        <div className={`mx-auto ${col}`}>
          <Link
            href={localeHref(locale, "/medee")}
            className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" /> {t.news.back}
          </Link>
        </div>

        <header className={`mx-auto mt-8 ${col} ${left ? "text-left" : "text-center"}`}>
          <p className={`flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm ${left ? "justify-start" : "justify-center"}`}>
            <span
              className={`rounded-full px-3 py-1 font-semibold ${post.category === "TIP" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-brand-soft text-brand"}`}
            >
              {post.category === "TIP" ? t.news.tipLabel : t.news.newsLabel}
            </span>
            {look.meta && (
              <>
                <time dateTime={post.publishedAt} className="whitespace-nowrap text-muted">
                  {date}
                </time>
                <span aria-hidden className="text-line-strong">
                  ·
                </span>
                <span className="inline-flex items-center gap-1 whitespace-nowrap text-muted">
                  <Clock className="size-3.5" aria-hidden />
                  {t.news.readTime.replace("{n}", String(post.readMinutes))}
                </span>
              </>
            )}
          </p>
          <h1 className="mt-5 text-3xl leading-[1.15] font-bold tracking-[-0.02em] text-balance sm:text-5xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className={`mt-5 text-lg leading-relaxed text-muted text-pretty sm:text-xl ${left ? "" : "mx-auto max-w-2xl"}`}>
              {post.excerpt}
            </p>
          )}
          <span aria-hidden className={`mt-8 block h-1 w-12 rounded-full bg-brand ${left ? "" : "mx-auto"}`} />
        </header>

        {showCover && look.cover === "framed" && (
          <div className="relative mx-auto mt-10 aspect-[16/9] max-w-5xl overflow-hidden rounded-3xl bg-soft shadow-card ring-1 ring-line">
            {/* Blurred copy of the cover fills the frame so any image shape sits centred and balanced. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover!}
              alt=""
              aria-hidden
              className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-2xl"
            />
            <ViewerImage
              index={0}
              src={post.cover!}
              width={post.dims[post.cover!]?.width}
              height={post.dims[post.cover!]?.height}
              priority
              className="relative flex size-full items-center justify-center"
              imgClassName="h-auto max-h-full w-auto max-w-full"
            />
          </div>
        )}
        {showCover && look.cover === "wide" && (
          <ViewerImage
            index={0}
            src={post.cover!}
            width={post.dims[post.cover!]?.width}
            height={post.dims[post.cover!]?.height}
            priority
            className="mx-auto mt-10 block max-w-5xl overflow-hidden rounded-3xl bg-soft shadow-card ring-1 ring-line"
            imgClassName="h-auto w-full"
          />
        )}

        <div className={`mx-auto mt-10 sm:mt-12 ${col}`}>
          <div className={`rich ${TEXT[look.text]}`} dangerouslySetInnerHTML={{ __html: post.body }} />
          {post.gallery.length > 0 && (
            <ul
              className={`mt-12 grid gap-3 [contain-intrinsic-size:auto_600px] [content-visibility:auto] ${post.gallery.length === 1 || look.gallery === "stack" ? "" : "grid-cols-2"}`}
            >
              {post.gallery.map((src, i) => {
                const single = post.gallery.length === 1 || look.gallery === "stack";
                // An odd last photo spans both columns so the grid stays balanced.
                const wide = !single && post.gallery.length % 2 === 1 && i === post.gallery.length - 1;
                return (
                  <li
                    key={src}
                    className={`overflow-hidden rounded-2xl bg-soft ring-1 ring-line ${wide ? "col-span-2 aspect-[2/1]" : single ? "" : "aspect-[4/3]"}`}
                  >
                    <ViewerImage
                      index={galleryOffset + i}
                      src={src}
                      width={post.dims[src]?.width}
                      height={post.dims[src]?.height}
                      className="size-full"
                      imgClassName={single ? "h-auto w-full" : "size-full object-cover"}
                    />
                  </li>
                );
              })}
            </ul>
          )}
          {look.share && (
            <div className="mt-12 flex flex-col items-center gap-4 border-t border-line pt-8 text-center">
              <span className="text-sm font-semibold">{t.news.share}</span>
              <ShareButtons url={url} title={post.title} copyLabel={t.news.copyLink} copiedLabel={t.news.copied} />
            </div>
          )}
        </div>
      </article>

      {look.related && related.length > 0 && (
        <section className="border-t border-line bg-soft [contain-intrinsic-size:auto_520px] [content-visibility:auto]">
          <div className="container-wide py-12 sm:py-16">
            <h2 className="text-center text-2xl font-bold tracking-tight">{t.news.relatedTitle}</h2>
            <span aria-hidden className="mx-auto mt-4 block h-1 w-10 rounded-full bg-brand" />
            <ul className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.slug} className="flex">
                  <Link
                    href={localeHref(locale, `/medee/${p.slug}`)}
                    className="group flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop"
                  >
                    <span className="relative block aspect-[16/10] overflow-hidden bg-soft">
                      {p.cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.cover}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      )}
                    </span>
                    <span className="flex flex-1 flex-col p-4">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <span
                          className={`rounded-full px-2 py-0.5 font-semibold ${p.category === "TIP" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-brand-soft text-brand"}`}
                        >
                          {p.category === "TIP" ? t.news.tipLabel : t.news.newsLabel}
                        </span>
                        <time dateTime={p.publishedAt} className="whitespace-nowrap text-muted">
                          {new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "mn-MN", {
                            dateStyle: "medium",
                            timeZone: "Asia/Ulaanbaatar",
                          }).format(new Date(p.publishedAt))}
                        </time>
                      </span>
                      <span className="mt-2 line-clamp-2 font-bold group-hover:text-brand">{p.title}</span>
                      <span className="mt-1 line-clamp-2 text-sm text-muted">{p.excerpt}</span>
                      <ArrowRight
                        className="mt-auto ml-auto size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
                        aria-hidden
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </ImageViewerProvider>
  );
}
