/** Share-dialog URLs for a page (no API keys; each network reads the page's OG tags). */
export function shareLinks(url: string, title: string) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return [
    { network: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { network: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { network: "X", href: `https://x.com/intent/post?url=${u}&text=${t}` },
  ] as const;
}

export const siteOrigin = () => (process.env.SITE_URL ?? "https://macs.mn").replace(/\/$/, "");

/** Public URL of a post in a locale (Mongolian at the root, English under /en). */
export const postUrl = (origin: string, slug: string, locale: "mn" | "en" = "mn") =>
  `${origin}${locale === "en" ? "/en" : ""}/medee/${slug}`;
