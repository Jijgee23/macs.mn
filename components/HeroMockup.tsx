import type { SiteContent } from "@/content/types";

/** Decorative, illustrative app window for the hero — not real data. */
const bars = [38, 52, 44, 61, 57, 70, 64, 78, 72, 86, 81, 94];

export function HeroMockup({ t }: { t: SiteContent["mockup"] }) {
  return (
    <div aria-hidden className="relative select-none">
      <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-tr from-brand-soft to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
        <div className="flex items-center gap-1.5 border-b border-line bg-soft px-4 py-3">
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="ml-3 rounded-md bg-surface px-2 py-0.5 text-[10px] text-muted">MACS ERP</span>
        </div>
        <div className="grid text-[11px] sm:grid-cols-[140px_1fr]">
          <ul className="hidden space-y-0.5 border-r border-line p-2.5 sm:block">
            {t.sidebar.map((item, i) => (
              <li
                key={item}
                className={`truncate rounded-md px-2 py-1.5 ${i === 0 ? "bg-brand-soft font-semibold text-brand" : "text-muted"}`}
              >
                {item}
              </li>
            ))}
          </ul>
          <div className="space-y-3 p-3 sm:p-4">
            <div className="grid grid-cols-3 gap-2">
              {t.kpis.map((c) => (
                <div key={c.label} className="rounded-lg border border-line p-2">
                  <p className="truncate text-muted">{c.label}</p>
                  <p className="mt-0.5 text-sm font-bold">{c.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-line p-3">
              <p className="text-muted">{t.chartTitle}</p>
              <div className="mt-2 flex h-20 items-end gap-1">
                {bars.map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm ${i === bars.length - 1 ? "bg-brand" : "bg-brand/25"}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
            <ul className="divide-y divide-line rounded-lg border border-line">
              {t.rows.map((r) => (
                <li key={r.name} className="flex justify-between gap-2 px-2.5 py-1.5">
                  <span className="truncate text-muted">{r.name}</span>
                  <span className="font-semibold tabular-nums">{r.amount}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
