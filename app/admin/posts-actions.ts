"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { POSTS_TAG } from "@/lib/posts";
import { sanitizePostHtml, textLength } from "@/lib/sanitize";
import { isSlug } from "@/lib/slug";

export type PostInput = {
  category: "NEWS" | "TIP";
  status: "DRAFT" | "PUBLISHED";
  slug: string;
  titleMn: string;
  excerptMn: string;
  bodyMn: string;
  titleEn: string;
  excerptEn: string;
  bodyEn: string;
  coverId: string | null;
};

export type SavePostResult = { ok: boolean; id?: string; errors?: string[] };

const schema = z.object({
  category: z.enum(["NEWS", "TIP"]),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  slug: z.string().trim().toLowerCase().refine(isSlug, "Slug зөвхөн латин жижиг үсэг, тоо, зураас (-) агуулна"),
  titleMn: z.string().trim().min(1, "MN гарчиг хоосон байна").max(200, "MN гарчиг хэт урт"),
  excerptMn: z.string().trim().max(400, "MN товч тайлбар 400 тэмдэгтээс ихгүй"),
  bodyMn: z.string(),
  titleEn: z.string().trim().max(200, "EN гарчиг хэт урт"),
  excerptEn: z.string().trim().max(400, "EN товч тайлбар 400 тэмдэгтээс ихгүй"),
  bodyEn: z.string(),
  coverId: z.string().nullable(),
});

/** First ~200 characters of the body text, for an empty excerpt. */
function autoExcerpt(html: string) {
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
  return text.length > 200 ? `${text.slice(0, 197).replace(/\s+\S*$/, "")}…` : text;
}

export async function savePost(id: string | null, input: PostInput): Promise<SavePostResult> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((i) => i.message) };
  const d = parsed.data;

  const bodyMn = sanitizePostHtml(d.bodyMn);
  const bodyEn = sanitizePostHtml(d.bodyEn);
  const hasEn = d.titleEn !== "";
  const errors: string[] = [];
  if (textLength(bodyMn) === 0) errors.push("MN агуулга хоосон байна");
  if (hasEn && textLength(bodyEn) === 0) errors.push("EN гарчиг бөглөсөн бол EN агуулга ч бөглөнө");
  if (!hasEn && textLength(bodyEn) > 0) errors.push("EN агуулга бичсэн бол EN гарчиг бөглөнө");
  if (await db.post.findFirst({ where: { slug: d.slug, NOT: id ? { id } : undefined }, select: { id: true } })) {
    errors.push("Ийм slug-тай нийтлэл байна — өөр slug сонгоно уу");
  }
  if (d.coverId && !(await db.media.findUnique({ where: { id: d.coverId }, select: { id: true } }))) {
    errors.push("Cover зураг олдсонгүй");
  }
  if (errors.length) return { ok: false, errors };

  const existing = id ? await db.post.findUnique({ where: { id }, select: { publishedAt: true } }) : null;
  if (id && !existing) return { ok: false, errors: ["Нийтлэл олдсонгүй"] };

  const data = {
    category: d.category,
    status: d.status,
    slug: d.slug,
    titleMn: d.titleMn,
    excerptMn: d.excerptMn || autoExcerpt(bodyMn),
    bodyMn,
    titleEn: hasEn ? d.titleEn : null,
    excerptEn: hasEn ? d.excerptEn || autoExcerpt(bodyEn) : null,
    bodyEn: hasEn ? bodyEn : null,
    coverId: d.coverId,
    // First publish stamps the date; later edits keep it.
    publishedAt: d.status === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null),
    updatedBy: admin.email,
  };

  const post = id ? await db.post.update({ where: { id }, data }) : await db.post.create({ data });
  updateTag(POSTS_TAG);
  revalidatePath("/admin/posts");
  return { ok: true, id: post.id };
}

export async function deletePost(id: string) {
  await requireAdmin();
  await db.post.delete({ where: { id } }).catch(() => null);
  updateTag(POSTS_TAG);
  revalidatePath("/admin/posts");
}
