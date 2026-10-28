/** Locale helpers safe for both Server and Client Components. */

export const locales = ["mn", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "mn";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/**
 * Public URL for a path in a locale. Mongolian lives at the root (proxy.ts rewrites
 * it to /mn internally); English lives under /en.
 *   localeHref("en", "/une-sanal") → "/en/une-sanal",  localeHref("en", "/#modules") → "/en#modules"
 */
export function localeHref(locale: Locale, path: string): string {
  if (locale === defaultLocale) return path;
  if (path === "/") return `/${locale}`;
  if (path.startsWith("/#")) return `/${locale}${path.slice(1)}`;
  return `/${locale}${path}`;
}

/** Strips a visible locale prefix: "/en/une-sanal" → "/une-sanal", "/en" → "/". */
export function stripLocale(pathname: string): string {
  for (const locale of locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}
