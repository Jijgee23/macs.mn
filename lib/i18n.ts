import { lang } from "next/root-params";
import { en } from "@/content/en";
import { mn } from "@/content/mn";
import type { SiteContent } from "@/content/types";
import { defaultLocale, isLocale, type Locale } from "./locale";

export const content: Record<Locale, SiteContent> = { mn, en };

/** Current locale from the app/[lang] root segment. Server Components only. */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  return isLocale(value) ? value : defaultLocale;
}

export async function getContent() {
  const locale = await getLocale();
  return { locale, t: content[locale] };
}
