import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitch } from "./LanguageSwitch";
import { DOCS_URL } from "@/content/common";
import { getContent } from "@/lib/i18n";
import { localeHref } from "@/lib/locale";

export async function SiteHeader() {
  const { locale, t } = await getContent();
  const nav = [
    { href: "/#products", label: t.nav.products },
    { href: "/#modules", label: t.nav.modules },
    { href: "/#why", label: t.nav.why },
    { href: "/#implementation", label: t.nav.implementation },
    { href: "/holboo-barih", label: t.nav.contact },
  ].map((item) => ({ ...item, href: localeHref(locale, item.href) }));
  const quoteHref = localeHref(locale, "/une-sanal");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="container-wide flex h-16 items-center justify-between gap-4">
        <Logo href={localeHref(locale, "/")} label={t.nav.home} />
        <nav className="hidden items-center gap-1 text-sm lg:flex" aria-label={t.nav.mainNav}>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-muted transition-colors hover:bg-soft hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={DOCS_URL}
            className="rounded-full px-3 py-1.5 text-muted transition-colors hover:bg-soft hover:text-ink"
          >
            {t.nav.docs}
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitch current={locale} label={t.nav.language} />
          <ThemeToggle label={t.nav.theme} />
          <Link
            href={quoteHref}
            className="hidden rounded-full bg-cta px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cta-hover sm:inline-flex"
          >
            {t.nav.quote}
          </Link>
          <details className="group relative lg:hidden">
            <summary
              className="flex size-9 cursor-pointer list-none items-center justify-center rounded-full border border-line text-muted hover:text-ink [&::-webkit-details-marker]:hidden"
              aria-label={t.nav.menu}
            >
              <Menu className="size-4" aria-hidden />
            </summary>
            <nav
              className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-surface p-2 shadow-pop"
              aria-label={t.nav.mobileNav}
            >
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-2 text-sm hover:bg-soft">
                  {item.label}
                </Link>
              ))}
              <a href={DOCS_URL} className="block rounded-xl px-3 py-2 text-sm hover:bg-soft">
                {t.nav.docs}
              </a>
              <Link
                href={quoteHref}
                className="mt-1 block rounded-xl bg-cta px-3 py-2 text-center text-sm font-semibold text-white"
              >
                {t.nav.quote}
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
