import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { lang } from "next/root-params";
import { db } from "@/lib/db";
import { en } from "@/content/en";
import { mn } from "@/content/mn";
import { defaultContactInfo } from "@/content/common";
import { contactInfoSchema, sectionSchemas, type ContactInfo, type SectionKey, type SiteContent } from "@/content/schema";
import { defaultLocale, isLocale, type Locale } from "./locale";

/** Cache tag for everything editable in /admin/content; saves call updateTag(CONTENT_TAG). */
export const CONTENT_TAG = "content";

export const fallbackContent: Record<Locale, SiteContent> = { mn, en };

/**
 * Overlays saved content on the built-in content: objects merge key by key, anything
 * else (strings, lists) comes from the database. Keys added to the built-in content
 * after a section was saved (e.g. a new form error) thus keep their default.
 */
export function overlay(base: unknown, saved: unknown): unknown {
  const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
  if (!isObj(base) || !isObj(saved)) return saved === undefined ? base : saved;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(saved)) out[k] = overlay(base[k], v);
  return out;
}

type AllContent = { content: Record<Locale, SiteContent>; contact: ContactInfo };

/**
 * All site content, cached until an admin saves. Sections missing from the database
 * (or failing validation) fall back to content/mn.ts and content/en.ts, so the site
 * still renders with an empty or unreachable database.
 */
export async function loadAllContent(): Promise<AllContent> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("max");

  const content: Record<Locale, SiteContent> = { mn: { ...mn }, en: { ...en } };
  let contact = defaultContactInfo;

  let rows: { key: string; locale: string; data: unknown }[] = [];
  try {
    rows = await db.contentSection.findMany({ select: { key: true, locale: true, data: true } });
  } catch (err) {
    console.error("[content] database unavailable, using built-in content", err);
  }

  for (const row of rows) {
    if (row.key === "contact" && row.locale === "all") {
      const parsed = contactInfoSchema.safeParse(overlay(defaultContactInfo, row.data));
      if (parsed.success) contact = parsed.data;
      continue;
    }
    if (!isLocale(row.locale) || !(row.key in sectionSchemas)) continue;
    const key = row.key as SectionKey;
    const parsed = sectionSchemas[key].safeParse(overlay(fallbackContent[row.locale][key], row.data));
    if (parsed.success) {
      (content[row.locale] as Record<SectionKey, unknown>)[key] = parsed.data;
    } else {
      console.error(`[content] invalid ${key}/${row.locale} in database, using built-in`);
    }
  }

  return { content, contact };
}

/** Current locale from the app/[lang] root segment. Server Components only. */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  return isLocale(value) ? value : defaultLocale;
}

export async function getContent() {
  const [locale, all] = await Promise.all([getLocale(), loadAllContent()]);
  return { locale, t: all.content[locale], contact: all.contact };
}

/** For generateMetadata, which receives the locale as a param. */
export async function getContentFor(locale: string) {
  const all = await loadAllContent();
  return all.content[isLocale(locale) ? locale : defaultLocale];
}

export const formatTagline = (tagline: string, year: number) => tagline.replace("{year}", String(year));
