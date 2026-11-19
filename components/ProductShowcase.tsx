import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import type { SiteContent } from "@/content/schema";
import { localeHref, type Locale } from "@/lib/locale";
import { hasPage, productSlugs, type Product } from "@/lib/products";

type Labels = Pick<SiteContent["products"], "moreLabel" | "comingSoonLabel">;

const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/** Logo in a bordered white square, or a plain icon when there is none. */
export function ProductMark({ p, size, fallback }: { p: Product; size: string; fallback: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden",
        size,
        p.logo ? "border border-line bg-white p-1.5" : fallback,
      )}
    >
      {p.logo ? (
        // Logos sit in boxes of up to ~56px; 128px covers 2x screens.
        <Image alt="" className="size-full object-contain" height={128} src={p.logo} width={128} />
      ) : (
        <Package className="size-1/2" aria-hidden />
      )}
    </span>
  );
}

/**
 * «Бүтээгдэхүүн» on the home page: every product as the same card in one grid. A product
 * with a detailed description links to its own page; otherwise to its external link (new
 * tab) when it has one.
 */
export function ProductShowcase({
  items,
  all,
  labels,
  locale,
}: {
  /** The visible products. */
  items: Product[];
  /** Every product in list order, so slugs match the detail pages. */
  all: Product[];
  labels: Labels;
  locale: Locale;
}) {
  const slugs = productSlugs(all);

  return (
    <ul className="mt-12 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => {
        const detail = hasPage(p);
        const className = cn(
          "group flex h-full min-h-64 flex-col rounded-3xl border bg-surface p-6 transition-all sm:p-7",
          p.comingSoon ? "border-dashed border-line-strong" : "border-line",
          detail && "hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-pop",
        );
        const body = (
          <>
            <div className="flex items-center gap-3">
              <ProductMark p={p} size="size-12 rounded-2xl" fallback="bg-brand-soft text-brand" />
              {p.comingSoon && (
                <span className="ml-auto shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {labels.comingSoonLabel}
                </span>
              )}
            </div>
            <h3 className="mt-5 text-xl font-bold group-hover:text-brand">{p.name}</h3>
            <p className="mt-2 line-clamp-3 leading-relaxed text-muted">{p.purpose}</p>
            <p className="mt-3 line-clamp-2 text-sm font-medium text-ink/80">{p.highlight}</p>
            {detail && (
              <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-brand transition-all group-hover:gap-2.5">
                {labels.moreLabel}
                <ArrowRight className="size-4" aria-hidden />
              </span>
            )}
          </>
        );
        return (
          <li key={p.name}>
            {detail ? (
              <Link href={localeHref(locale, `/buteegdehuun/${slugs[all.indexOf(p)]}`)} className={className}>
                {body}
              </Link>
            ) : (
              <div className={className}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
