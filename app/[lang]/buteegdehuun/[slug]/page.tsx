import type { Metadata } from "next";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Apple, ArrowLeft, ArrowRight, ArrowUpRight, Download, Smartphone } from "lucide-react";
import { getContent, getContentFor } from "@/lib/content";
import { isLocale, localeHref, type Locale } from "@/lib/locale";
import { hasPage, productSlugs, type Product } from "@/lib/products";
import { ProductMark } from "@/components/ProductShowcase";
import { groupImageRows, imageSrcs, sanitizePostHtml, textLength } from "@/lib/sanitize";
import { ImageViewerProvider } from "@/components/ImageViewer";
import { RichHtml } from "@/components/RichHtml";

const LABELS = {
  mn: { back: "Бүх бүтээгдэхүүн", website: "Вэбсайт үзэх", brochure: "Танилцуулга татах", ios: "App Store-оос татах", android: "Google Play-ээс татах", other: "Бусад бүтээгдэхүүн" },
  en: { back: "All products", website: "Visit website", brochure: "Download brochure", ios: "Download on the App Store", android: "Get it on Google Play", other: "Other products" },
} as const;

/** Cleans and groups the stored description. Cached because sanitize-html uses Math.random(), which cannot run during prerendering. */
async function renderDetails(details: string) {
  "use cache";
  cacheLife("max");
  return textLength(details) > 0 ? groupImageRows(sanitizePostHtml(details)) : "";
}

/** The product behind a slug, only when it is visible and has a detailed description. */
function find(items: Product[], slug: string) {
  const slugs = productSlugs(items);
  const i = slugs.indexOf(slug);
  const p = items[i];
  return p && !p.hidden && hasPage(p) ? { p, slugs } : null;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/buteegdehuun/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale: Locale = isLocale(lang) ? lang : "mn";
  const found = find((await getContentFor(locale)).products.items, slug);
  if (!found) notFound();
  return {
    title: found.p.name,
    description: found.p.purpose,
    alternates: { canonical: localeHref(locale, `/buteegdehuun/${slug}`) },
  };
}

export default function ProductPage({ params }: PageProps<"/[lang]/buteegdehuun/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="container-wide animate-pulse py-14" aria-hidden>
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <div className="mx-auto size-16 rounded-3xl bg-soft" />
            <div className="mx-auto h-10 w-2/3 rounded-lg bg-soft" />
            <div className="mx-auto h-5 w-4/5 rounded-lg bg-soft" />
          </div>
        </div>
      }
    >
      <Product params={params} />
    </Suspense>
  );
}

async function Product({ params }: { params: PageProps<"/[lang]/buteegdehuun/[slug]">["params"] }) {
  const { slug } = await params;
  const { locale, t } = await getContent();
  const found = find(t.products.items, slug);
  if (!found) notFound();
  const { p, slugs } = found;
  const l = LABELS[locale];
  // Defence in depth: the admin editor's HTML is cleaned again before it is rendered.
  const html = await renderDetails(p.details);
  const others = t.products.items
    .map((item, i) => ({ item, slug: slugs[i] }))
    .filter(({ item, slug: s }) => s !== slug && !item.hidden && hasPage(item))
    .slice(0, 3);

  return (
    <ImageViewerProvider images={imageSrcs(html)} locale={locale}>
      <article className="container-wide py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <Link
            href={localeHref(locale, "/#products")}
            className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> {l.back}
          </Link>

          <header className="mt-8 text-center">
            <ProductMark p={p} size="mx-auto size-16 rounded-3xl" fallback="bg-brand-soft text-brand" />
            <h1 className="mt-6 text-3xl leading-[1.15] font-bold tracking-[-0.02em] text-balance sm:text-5xl">
              {p.name}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted text-pretty sm:text-xl">
              {p.purpose}
            </p>
            <p className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
              {p.comingSoon && (
                <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {t.products.comingSoonLabel}
                </span>
              )}
              <span className="rounded-full bg-brand-soft px-3 py-1 font-semibold text-brand">{p.highlight}</span>
            </p>
            <span aria-hidden className="mx-auto mt-8 block h-1 w-12 rounded-full bg-brand" />
          </header>

          {html && <RichHtml html={html} className="rich rich-zoom mt-10" />}

          <div className="mt-12 flex flex-col flex-wrap items-center justify-center gap-3 border-t border-line pt-8 sm:flex-row">
            {!p.comingSoon && (
              <Link
                href={localeHref(locale, "/une-sanal")}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-cta px-6 py-3 font-semibold text-white transition-colors hover:bg-cta-hover"
              >
                {t.hero.primary}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            )}
            {p.appStore && (
              <a
                href={p.appStore}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 font-semibold text-bg transition-opacity hover:opacity-85"
              >
                <Apple className="size-4" aria-hidden /> {l.ios}
              </a>
            )}
            {p.playStore && (
              <a
                href={p.playStore}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 font-semibold text-bg transition-opacity hover:opacity-85"
              >
                <Smartphone className="size-4" aria-hidden /> {l.android}
              </a>
            )}
            {p.brochure && (
              <a
                href={p.brochure}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-6 py-3 font-semibold transition-colors hover:border-line-strong"
              >
                <Download className="size-4" aria-hidden /> {l.brochure}
              </a>
            )}
            {p.href && (
              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-6 py-3 font-semibold transition-colors hover:border-line-strong"
              >
                {l.website} <ArrowUpRight className="size-4" aria-hidden />
              </a>
            )}
          </div>
        </div>
      </article>

      {others.length > 0 && (
        <section className="border-t border-line bg-soft">
          <div className="container-wide py-12 sm:py-16">
            <h2 className="text-center text-2xl font-bold tracking-tight">{l.other}</h2>
            <span aria-hidden className="mx-auto mt-4 block h-1 w-10 rounded-full bg-brand" />
            <ul className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {others.map(({ item, slug: s }) => (
                <li key={s} className="flex">
                  <Link
                    href={localeHref(locale, `/buteegdehuun/${s}`)}
                    className="group flex w-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop"
                  >
                    <ProductMark p={item} size="size-10 rounded-xl" fallback="bg-brand-soft text-brand" />
                    <span className="mt-4 font-bold group-hover:text-brand">{item.name}</span>
                    <span className="mt-1 line-clamp-2 text-sm text-muted">{item.purpose}</span>
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
