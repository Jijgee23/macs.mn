import Link from "next/link";
import type { ReactNode } from "react";
import type { RequestStatus } from "@prisma/client";
import { Logo } from "@/components/Logo";
import { logout, updateRequest, type RequestKind } from "./actions";

export const STATUS_LABELS: Record<RequestStatus, string> = {
  NEW: "Шинэ",
  CONTACTED: "Холбогдсон",
  CLOSED: "Хаасан",
};

const STATUS_STYLES: Record<RequestStatus, string> = {
  NEW: "bg-brand-soft text-brand",
  CONTACTED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  CLOSED: "bg-soft text-muted",
};

const statuses = Object.keys(STATUS_LABELS) as RequestStatus[];

const dateFormat = new Intl.DateTimeFormat("mn-MN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ulaanbaatar",
});

export function isStatus(value: unknown): value is RequestStatus {
  return typeof value === "string" && value in STATUS_LABELS;
}

const sections = [
  { href: "/admin", label: "Үнийн санал" },
  { href: "/admin/messages", label: "Санал хүсэлт" },
];

export function AdminShell({ active, children }: { active: string; children: ReactNode }) {
  return (
    <div className="container-wide py-8">
      <div className="flex items-center justify-between gap-4">
        <Logo />
        <form action={logout}>
          <button className="text-sm text-muted hover:text-ink">Гарах</button>
        </form>
      </div>
      <nav className="mt-8 flex gap-6 border-b border-line" aria-label="Админ хэсгүүд">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`-mb-px border-b-2 pb-3 text-lg font-bold ${
              s.href === active ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}

export function StatusFilter({
  basePath,
  filter,
  counts,
}: {
  basePath: string;
  filter?: RequestStatus;
  counts: { status: RequestStatus; _count: number }[];
}) {
  const countOf = (s: RequestStatus) => counts.find((c) => c.status === s)?._count ?? 0;
  const tabs = [
    { label: "Бүгд", href: basePath, active: !filter, count: counts.reduce((sum, c) => sum + c._count, 0) },
    ...statuses.map((s) => ({
      label: STATUS_LABELS[s],
      href: `${basePath}?status=${s}`,
      active: filter === s,
      count: countOf(s),
    })),
  ];

  return (
    <nav className="mt-5 flex flex-wrap gap-2" aria-label="Төлөвөөр шүүх">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`rounded-full border px-3.5 py-1.5 text-sm ${
            t.active ? "border-brand bg-brand-soft text-brand" : "border-line text-muted hover:text-ink"
          }`}
        >
          {t.label} <span className="ml-1 opacity-70">{t.count}</span>
        </Link>
      ))}
    </nav>
  );
}

type Item = { id: string; status: RequestStatus; note: string | null; locale: string; createdAt: Date };

/** One request card: title block, status + date, body, and the status/note form. */
export function RequestCard({
  kind,
  item,
  title,
  subtitle,
  children,
}: {
  kind: RequestKind;
  item: Item;
  title: string;
  subtitle?: string | null;
  children: ReactNode;
}) {
  return (
    <li className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{title}</p>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          {item.locale === "en" && (
            <p className="mt-1 inline-block rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-semibold text-bg">
              EN — англиар хариулна
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-1 font-medium ${STATUS_STYLES[item.status]}`}>
            {STATUS_LABELS[item.status]}
          </span>
          <time className="text-muted" dateTime={item.createdAt.toISOString()}>
            {dateFormat.format(item.createdAt)}
          </time>
        </div>
      </div>

      {children}

      <form action={updateRequest} className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={item.id} />
        <select
          name="status"
          defaultValue={item.status}
          aria-label="Төлөв"
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <input
          name="note"
          defaultValue={item.note ?? ""}
          placeholder="Тэмдэглэл (хэн холбогдсон, юу ярилцсан…)"
          aria-label="Тэмдэглэл"
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-cta px-4 py-2 text-sm font-semibold text-white hover:bg-cta-hover">
          Хадгалах
        </button>
      </form>
    </li>
  );
}
