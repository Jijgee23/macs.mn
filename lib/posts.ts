import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { PostCategory } from "@prisma/client";
import { db } from "@/lib/db";
import type { Locale } from "@/lib/locale";

/** Cache tag for published posts; post saves/deletes call updateTag(POSTS_TAG). */
export const POSTS_TAG = "posts";

export type PublicPost = {
  slug: string;
  category: PostCategory;
  title: string;
  excerpt: string;
  body: string;
  cover: string | null;
  publishedAt: string;
  hasEn: boolean;
};

const mediaUrl = (id: string | null) => (id ? `/media/${id}` : null);

/** Published posts in a locale, newest first. English only lists posts with a translation. */
export async function listPosts(locale: Locale, category?: PostCategory, take = 60): Promise<PublicPost[]> {
  "use cache";
  cacheTag(POSTS_TAG);
  cacheLife("max");

  try {
    const rows = await db.post.findMany({
      where: {
        status: "PUBLISHED",
        ...(category ? { category } : {}),
        ...(locale === "en" ? { titleEn: { not: null } } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take,
    });
    return rows.map((p) => toPublic(p, locale));
  } catch (err) {
    console.error("[posts] database unavailable", err);
    return [];
  }
}

export async function getPost(slug: string, locale: Locale): Promise<PublicPost | null> {
  "use cache";
  cacheTag(POSTS_TAG);
  cacheLife("max");

  try {
    const p = await db.post.findUnique({ where: { slug } });
    if (!p || p.status !== "PUBLISHED") return null;
    if (locale === "en" && !p.titleEn) return null;
    return toPublic(p, locale);
  } catch (err) {
    console.error("[posts] database unavailable", err);
    return null;
  }
}

/** Whether a published Mongolian post exists, for the "only in Mongolian" notice on /en. */
export async function hasMnPost(slug: string) {
  "use cache";
  cacheTag(POSTS_TAG);
  cacheLife("max");
  try {
    return !!(await db.post.findFirst({ where: { slug, status: "PUBLISHED" }, select: { id: true } }));
  } catch {
    return false;
  }
}

type Row = Awaited<ReturnType<typeof db.post.findMany>>[number];

function toPublic(p: Row, locale: Locale): PublicPost {
  const en = locale === "en" && p.titleEn;
  return {
    slug: p.slug,
    category: p.category,
    title: en ? p.titleEn! : p.titleMn,
    excerpt: en ? (p.excerptEn ?? "") : p.excerptMn,
    body: en ? (p.bodyEn ?? "") : p.bodyMn,
    cover: mediaUrl(p.coverId),
    publishedAt: (p.publishedAt ?? p.createdAt).toISOString(),
    hasEn: !!p.titleEn,
  };
}
