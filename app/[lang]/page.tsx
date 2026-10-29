import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  ChartColumn,
  Check,
  ChevronDown,
  FolderKanban,
  Landmark,
  Mail,
  MapPin,
  Package,
  Phone,
  Plug,
  Receipt,
  ShoppingCart,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { DOCS_URL, moduleDocsIds, moduleKeys, telHref, type ModuleKey } from "@/content/common";
import { HeroMockup } from "@/components/HeroMockup";
import { PostCard } from "@/components/PostCard";
import { listPosts } from "@/lib/posts";
import { getContent, getContentFor } from "@/lib/content";
import { isLocale, localeHref } from "@/lib/locale";

const MODULE_ICONS: Record<ModuleKey, LucideIcon> = {
  setup: Building2,
  inventory: Package,
  pos: ShoppingCart,
  receivables: Receipt,
  payroll: Users,
  assets: Landmark,
  cash: Wallet,
  ledger: BookOpen,
  reports: ChartColumn,
  integrations: Plug,
  projects: FolderKanban,
  tools: Wrench,
};

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const t = await getContentFor(lang);
  return {
    title: { absolute: t.meta.title },
    alternates: { canonical: localeHref(isLocale(lang) ? lang : "mn", "/"), languages: { mn: "/", en: "/en" } },
  };
}

function SectionHeading({
  eyebrow,
  title,
  intro,
  center = false,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-sm font-semibold text-brand">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {intro && <p className="mt-4 text-lg text-muted text-pretty">{intro}</p>}
    </div>
  );
}

export default async function Home() {
  const { locale, t, contact } = await getContent();
  const latest = await listPosts(locale, undefined, 3);
  const quoteHref = localeHref(locale, "/une-sanal");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="bg-dots absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div aria-hidden className="bg-glow absolute inset-0" />
        <div className="container-wide relative grid items-center gap-12 pt-16 pb-20 sm:pt-24 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted shadow-card">
              <span className="size-1.5 rounded-full bg-brand" />
              {t.hero.badge}
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-balance sm:text-6xl">
              {t.hero.titleStart} <span className="text-brand">{t.hero.titleAccent}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted text-pretty">{t.hero.lead}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={quoteHref}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-cta px-6 py-3 font-semibold text-white shadow-[0_8px_20px_-8px_rgba(185,28,28,.6)] transition-colors hover:bg-cta-hover"
              >
                {t.hero.primary}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <a
                href="#modules"
                className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-6 py-3 font-semibold transition-colors hover:border-line-strong"
              >
                {t.hero.secondary}
              </a>
            </div>
          </div>
          <HeroMockup t={t.mockup} />
        </div>

        <div className="relative border-y border-line bg-surface/60 backdrop-blur">
          <dl className="container-wide grid grid-cols-2 md:grid-cols-4">
            {t.stats.map((s, i) => (
              <div
                key={s.label}
                className={`flex flex-col-reverse py-8 text-center ${i % 2 === 1 ? "border-l border-line" : ""} ${i >= 2 ? "border-t border-line md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`}
              >
                <dt className="mt-1 text-sm text-muted">{s.label}</dt>
                <dd className="text-3xl font-bold tracking-tight sm:text-4xl">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="container-wide py-20 sm:py-28">
        <SectionHeading eyebrow={t.products.eyebrow} title={t.products.title} intro={t.products.intro} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.products.items.map((p) => (
            <article
              key={p.name}
              className="group rounded-2xl border border-line bg-surface p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop"
            >
              <h3 className="text-lg font-bold">{p.name}</h3>
              <p className="mt-2 text-sm text-muted">{p.purpose}</p>
              <p className="mt-5 flex items-center gap-2 text-sm font-medium">
                <Check className="size-4 shrink-0 text-brand" aria-hidden />
                {p.highlight}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">
          {t.products.alsoLabel}: {t.products.others.join(" · ")}
        </p>
      </section>

      {/* Modules */}
      <section id="modules" className="border-y border-line bg-soft">
        <div className="container-wide py-20 sm:py-28">
          <SectionHeading eyebrow={t.modules.eyebrow} title={t.modules.title} intro={t.modules.intro} />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {moduleKeys.map((key) => {
              const m = t.modules.items[key];
              const Icon = MODULE_ICONS[key];
              return (
                <article
                  key={key}
                  className="group flex flex-col rounded-2xl border border-line bg-surface p-6 shadow-card transition-colors hover:border-line-strong"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl border border-brand-line bg-brand-soft text-brand">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 font-bold">{m.title}</h3>
                  <p className="mt-2 text-sm text-muted">{m.summary}</p>
                  <ul className="mt-4 space-y-2 text-sm">
                    {m.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`${DOCS_URL}/${moduleDocsIds[key]}`}
                    hrefLang="mn"
                    className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-medium text-muted transition-colors hover:text-brand"
                  >
                    {t.modules.docsLink}
                    <ArrowUpRight className="size-3.5" aria-hidden />
                  </a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="container-wide py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <SectionHeading
            eyebrow={t.integrations.eyebrow}
            title={t.integrations.title}
            intro={t.integrations.intro}
          />
          <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {t.integrations.items.map((i) => (
              <div key={i.name} className="bg-surface p-6">
                <h3 className="flex items-center gap-2 font-bold">
                  <Plug className="size-4 text-brand" aria-hidden />
                  {i.name}
                </h3>
                <p className="mt-2 text-sm text-muted">{i.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="border-y border-line bg-soft">
        <div className="container-wide py-20 sm:py-28">
          <SectionHeading eyebrow={t.why.eyebrow} title={t.why.title} center />
          <div className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {t.why.items.map((r) => (
              <div key={r.title}>
                <span className="flex size-8 items-center justify-center rounded-full bg-cta text-white">
                  <Check className="size-4" aria-hidden />
                </span>
                <h3 className="mt-4 font-bold">{r.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation */}
      <section id="implementation" className="container-wide py-20 sm:py-28">
        <SectionHeading
          eyebrow={t.implementation.eyebrow}
          title={t.implementation.title}
          intro={t.implementation.intro}
        />
        <ol className="relative mt-14 grid gap-8 md:grid-cols-5 md:gap-4">
          <div aria-hidden className="absolute top-4 right-0 left-0 hidden h-px bg-line md:block" />
          {t.implementation.steps.map((s, i) => (
            <li key={s.title} className="relative">
              <span className="relative flex size-8 items-center justify-center rounded-full border border-line bg-surface text-sm font-bold text-brand shadow-card">
                {i + 1}
              </span>
              <h3 className="mt-4 font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Latest posts (hidden until something is published) */}
      {latest.length > 0 && (
        <section className="container-wide pb-20 sm:pb-28">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow={t.news.eyebrow} title={t.news.latestTitle} />
            <Link href={localeHref(locale, "/medee")} className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
              {t.news.latestAll} <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((p) => (
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
        </section>
      )}

      {/* Trust */}
      <section className="border-y border-line bg-soft">
        <div className="container-wide grid gap-12 py-20 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold">{t.trust.partnersTitle}</h2>
            <p className="mt-3 text-sm text-muted">{t.trust.partnersIntro}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {t.trust.partners.map((p) => (
                <li key={p} className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm">
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold">{t.trust.membershipsTitle}</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {t.trust.memberships.map((m) => (
                <li key={m} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-line">
        <div className="container-wide grid gap-10 py-20 sm:py-28 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <SectionHeading eyebrow={t.faq.eyebrow} title={t.faq.title} intro={t.faq.intro} />
            <Link
              href={localeHref(locale, "/holboo-barih")}
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
            >
              {t.nav.contact} <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {t.faq.items.map((item) => (
              <details key={item.question} className="group py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-semibold transition-colors hover:text-brand [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <ChevronDown className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="pb-5 text-muted whitespace-pre-line">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
        <script
          type="application/ld+json"
          // FAQPage structured data: lets search engines show these as rich results.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              inLanguage: locale,
              mainEntity: t.faq.items.map((i) => ({
                "@type": "Question",
                name: i.question,
                acceptedAnswer: { "@type": "Answer", text: i.answer },
              })),
            }).replace(/</g, "\\u003c"),
          }}
        />
      </section>

      {/* CTA + contact */}
      <section id="contact" className="container-wide py-20 sm:py-28">
        <div className="relative overflow-hidden rounded-3xl bg-[#0b0b0f] p-8 text-white sm:p-12 dark:border dark:border-line">
          <div
            aria-hidden
            className="absolute -top-32 -right-32 size-96 rounded-full bg-[#b91c1c] opacity-40 blur-3xl"
          />
          <div className="relative grid gap-10 md:grid-cols-[1.3fr_1fr]">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{t.cta.title}</h2>
              <p className="mt-4 text-white/70">{t.cta.body}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={quoteHref}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-[#0b0b0f] transition-colors hover:bg-white/90"
                >
                  {t.cta.button}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
                <Link
                  href={localeHref(locale, "/holboo-barih")}
                  className="inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {t.cta.secondary}
                </Link>
              </div>
            </div>
            <div className="space-y-4 text-sm">
              <p className="font-semibold">{t.company.name}</p>
              <ul className="space-y-2">
                {contact.phones.map((p) => (
                  <li key={p.number} className="flex items-center gap-2.5">
                    <Phone className="size-4 text-white/50" aria-hidden />
                    <a href={telHref(p.number)} className="hover:underline">
                      {p.number}
                    </a>
                    <span className="text-white/50">{t.company.phoneKinds[p.kind]}</span>
                  </li>
                ))}
              </ul>
              <p className="flex items-center gap-2.5">
                <Mail className="size-4 text-white/50" aria-hidden />
                <a href={`mailto:${contact.email}`} className="hover:underline">
                  {contact.email}
                </a>
              </p>
              <p className="flex items-start gap-2.5 text-white/70">
                <MapPin className="mt-0.5 size-4 shrink-0 text-white/50" aria-hidden />
                {t.company.address}
              </p>
              <p className="text-white/50">{t.company.hours}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
