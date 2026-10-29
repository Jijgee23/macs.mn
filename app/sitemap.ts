import type { MetadataRoute } from "next";
import { listPosts } from "@/lib/posts";
import { siteOrigin } from "@/lib/share";

/** Main pages in both languages plus every published post (English only when translated). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const pages = ["/", "/une-sanal", "/holboo-barih", "/medee"].flatMap((path) => [
    { url: `${origin}${path === "/" ? "" : path}`, alternates: { languages: { en: `${origin}/en${path === "/" ? "" : path}` } } },
    { url: `${origin}/en${path === "/" ? "" : path}` },
  ]);
  const [mn, en] = await Promise.all([listPosts("mn", undefined, 1000), listPosts("en", undefined, 1000)]);
  const posts = [
    ...mn.map((p) => ({ url: `${origin}/medee/${p.slug}`, lastModified: p.publishedAt })),
    ...en.map((p) => ({ url: `${origin}/en/medee/${p.slug}`, lastModified: p.publishedAt })),
  ];
  return [...pages, ...posts];
}
