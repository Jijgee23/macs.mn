import type { SiteContent } from "@/content/schema";

export type Product = SiteContent["products"]["items"][number];

const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "i", к: "k",
  л: "l", м: "m", н: "n", о: "o", ө: "u", п: "p", р: "r", с: "s", т: "t", у: "u", ү: "u", ф: "f",
  х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya",
};

/** "Рестораны POS" → "restoranii-pos"; "" when nothing usable is left. */
function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/./gu, (c) => CYRILLIC[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * URL slug of every product, in list order (so the index stays valid for hidden rows).
 * Derived from the name; duplicates and names with no usable letters get their position.
 */
export function productSlugs(items: Product[]): string[] {
  const seen = new Set<string>();
  return items.map((p, i) => {
    let slug = slugify(p.name) || `p${i + 1}`;
    if (seen.has(slug)) slug = `${slug}-${i + 1}`;
    seen.add(slug);
    return slug;
  });
}

/** A product gets a detail page when it has a description, a file, a link or a mobile app. */
export const hasPage = (p: Product) =>
  p.details.trim() !== "" || !!(p.brochure || p.href || p.appStore || p.playStore);
