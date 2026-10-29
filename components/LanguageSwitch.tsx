"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeHref, locales, stripLocale, type Locale } from "@/lib/locale";

type Props = { current: Locale; label: string };

/** Links to the same page in the other language; must sit inside <Suspense> (usePathname on dynamic routes). */
export function LanguageSwitch(props: Props) {
  // The browser path: "/une-sanal" for Mongolian, "/en/une-sanal" for English.
  return <LanguageLinks {...props} basePath={stripLocale(usePathname())} />;
}

/** Also the Suspense fallback, pointing at each language's home page. */
export function LanguageLinks({ current, label, basePath }: Props & { basePath: string }) {
  return (
    <nav
      aria-label={label}
      className="flex h-9 items-center rounded-full border border-line p-0.5 text-xs font-semibold"
    >
      {locales.map((locale) => (
        <Link
          key={locale}
          href={localeHref(locale, basePath)}
          hrefLang={locale}
          aria-current={locale === current ? "true" : undefined}
          className={`rounded-full px-2.5 py-1.5 uppercase transition-colors ${
            locale === current ? "bg-ink text-bg" : "text-muted hover:text-ink"
          }`}
        >
          {locale}
        </Link>
      ))}
    </nav>
  );
}
