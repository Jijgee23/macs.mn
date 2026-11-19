import Image from "next/image";
import { ArrowRight, ArrowUpRight, Package } from "lucide-react";
import type { SiteContent } from "@/content/schema";

type Product = SiteContent["products"]["items"][number];
type Labels = Pick<SiteContent["products"], "moreLabel" | "comingSoonLabel" | "aboutLabel" | "otherTitle">;
type Group = "main" | "featured" | "other";

const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/** Columns for the "other" row: a count that fills whole rows where possible. */
const OTHER_COLS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
};
const otherCols = (n: number) => OTHER_COLS[n <= 5 ? n : n % 5 === 0 ? 5 : n % 4 === 0 ? 4 : n % 3 === 0 ? 3 : 5];

/** Products with no group set go by order: the first is the main one, the next two featured. */
function split(items: Product[]) {
  const grouped = items.map((p, i): { p: Product; g: Group } => ({
    p,
    g: p.group || (i === 0 ? "main" : i < 3 ? "featured" : "other"),
  }));
  const main = grouped.find((x) => x.g === "main")?.p;
  // A second "main" is shown as a featured card instead of disappearing.
  const featured = grouped.filter((x) => x.g === "featured" || (x.g === "main" && x.p !== main)).map((x) => x.p);
  const other = grouped.filter((x) => x.g === "other").map((x) => x.p);
  return { main, featured, other };
}

/** Logo in a bordered white square, or a plain icon when there is none. */
function Mark({ p, size, fallback }: { p: Product; size: string; fallback: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden",
        size,
        p.logo ? "border border-line bg-white p-1.5" : fallback,
      )}
    >
      {p.logo ? (
        // Logos sit in boxes of up to ~48px; 128px covers 2x screens.
        <Image alt="" className="size-full object-contain" height={128} src={p.logo} width={128} />
      ) : (
        <Package className="size-1/2" aria-hidden />
      )}
    </span>
  );
}

/** The whole card is a link (new tab) when the product has one. */
function Card({ p, className, children }: { p: Product; className: string; children: React.ReactNode }) {
  return p.href ? (
    <a href={p.href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <div className={className}>{children}</div>
  );
}

/**
 * «Бүтээгдэхүүн» on the home page: the main product as a large card beside the featured
 * cards, then the other systems as a compact grid.
 */
export function ProductShowcase({ items, labels }: { items: Product[]; labels: Labels }) {
  const { main, featured, other } = split(items);

  return (
    <>
      {(main || featured.length > 0) && (
        <div
          className={cn(
            "mt-12 grid gap-4",
            main && featured.length > 0 && "lg:grid-cols-12",
            main && featured.length > 1 && "lg:grid-rows-2",
          )}
        >
          {main && (
            <div className={cn(featured.length > 0 && "lg:col-span-7", featured.length > 1 && "lg:row-span-2")}>
              <Card
                p={main}
                className={cn(
                  "group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-gradient-to-br from-brand-soft via-surface to-surface p-7 sm:p-9",
                  main.comingSoon ? "border-dashed border-brand/40" : "border-brand/25",
                )}
              >
                <div className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-brand/10 blur-2xl" />
                <div className="relative flex items-center gap-3">
                  <Mark p={main} size="size-12 rounded-2xl" fallback="bg-brand text-white" />
                  {main.comingSoon ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {labels.comingSoonLabel}
                    </span>
                  ) : (
                    <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-brand ring-1 ring-brand/20">
                      {main.highlight}
                    </span>
                  )}
                </div>
                <h3 className="relative mt-6 text-3xl font-extrabold sm:text-4xl">{main.name}</h3>
                <p className="relative mt-3 max-w-lg text-lg leading-relaxed text-muted">{main.purpose}</p>
                {main.comingSoon && <p className="relative mt-3 text-sm font-medium">{main.highlight}</p>}
                {main.href && (
                  <div className="relative mt-auto pt-8">
                    <span className="inline-flex h-11 items-center gap-2 rounded-full bg-cta px-5 text-sm font-semibold text-white transition-colors group-hover:bg-cta-hover">
                      {labels.aboutLabel.replace("{name}", main.name)} <ArrowRight className="size-4" aria-hidden />
                    </span>
                  </div>
                )}
              </Card>
            </div>
          )}

          {featured.map((p) => (
            <div key={p.name} className={cn(main && "lg:col-span-5")}>
              <Card
                p={p}
                className={cn(
                  "group flex h-full flex-col rounded-3xl border bg-surface p-7 transition-all hover:-translate-y-0.5 hover:shadow-pop",
                  p.comingSoon ? "border-dashed border-line-strong" : "border-line hover:border-brand/30",
                )}
              >
                <div className="flex items-center gap-3">
                  <Mark p={p} size="size-11 rounded-2xl" fallback="bg-soft text-brand" />
                  <h3 className="text-xl font-bold">{p.name}</h3>
                  {p.comingSoon ? (
                    <span className="ml-auto shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {labels.comingSoonLabel}
                    </span>
                  ) : (
                    <span className="ml-auto max-w-[45%] shrink-0 truncate rounded-full bg-soft px-2.5 py-1 text-xs font-semibold text-muted">
                      {p.highlight}
                    </span>
                  )}
                </div>
                <p className="mt-4 leading-relaxed text-muted">{p.purpose}</p>
                {p.href && (
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-brand transition-all group-hover:gap-2.5">
                    {labels.moreLabel} <ArrowRight className="size-4" aria-hidden />
                  </span>
                )}
              </Card>
            </div>
          ))}
        </div>
      )}

      {other.length > 0 && (
        <>
          <h3 className="mt-12 mb-4 text-sm font-semibold tracking-wider text-muted uppercase">{labels.otherTitle}</h3>
          <ul className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", otherCols(other.length))}>
            {other.map((p) => (
              <li key={p.name}>
                <Card
                  p={p}
                  className={cn(
                    "group flex h-full items-start gap-4 rounded-2xl border bg-surface p-4 transition-colors hover:border-brand/40 sm:flex-col sm:gap-0 sm:p-5",
                    p.comingSoon ? "border-dashed border-line-strong" : "border-line",
                  )}
                >
                  <div className="flex shrink-0 items-start justify-between sm:w-full">
                    <Mark
                      p={p}
                      size="size-9 rounded-xl"
                      fallback="bg-soft text-muted group-hover:bg-brand-soft group-hover:text-brand"
                    />
                    {p.href && (
                      <ArrowUpRight
                        className="hidden size-4 text-line-strong transition-colors group-hover:text-brand sm:block"
                        aria-hidden
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-bold sm:mt-4">
                      {p.name}
                      {p.comingSoon && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {labels.comingSoonLabel}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 line-clamp-3 text-sm leading-snug text-muted">{p.purpose}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
