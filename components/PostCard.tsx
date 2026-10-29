import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import type { PublicPost } from "@/lib/posts";

export function PostCard({
  post,
  href,
  categoryLabel,
  readMore,
  dateLocale,
}: {
  post: PublicPost;
  href: string;
  categoryLabel: string;
  readMore: string;
  dateLocale: string;
}) {
  const date = new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium", timeZone: "Asia/Ulaanbaatar" }).format(new Date(post.publishedAt));
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop">
      <Link href={href} className="block aspect-[1200/630] overflow-hidden bg-soft" tabIndex={-1} aria-hidden>
        {post.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <span className="flex size-full items-center justify-center text-line-strong">
            <Newspaper className="size-10" />
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-2 text-xs">
          <span className={`rounded-full px-2 py-0.5 font-semibold ${post.category === "TIP" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-brand-soft text-brand"}`}>
            {categoryLabel}
          </span>
          <time dateTime={post.publishedAt} className="text-muted">
            {date}
          </time>
        </p>
        <h3 className="mt-3 text-lg leading-snug font-bold text-balance">
          <Link href={href} className="hover:text-brand">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm text-muted">{post.excerpt}</p>
        <Link href={href} className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand">
          {readMore} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}
