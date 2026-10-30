import Link from "next/link";
import type { ReactNode } from "react";
import type { RequestStatus } from "@prisma/client";
import { updateRequest } from "@/app/admin/actions";
import { telHref } from "@/content/common";
import { adminButton, adminInput } from "./styles";

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

export const dateFormat = new Intl.DateTimeFormat("mn-MN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ulaanbaatar",
});

export function isStatus(value: unknown): value is RequestStatus {
  return typeof value === "string" && value in STATUS_LABELS;
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

/** Tabs per status; `labels` (default: quote/contact statuses) also sets their order. */
export function StatusFilter<S extends string = RequestStatus>({
  basePath,
  filter,
  counts,
  labels = STATUS_LABELS as Record<S, string>,
}: {
  basePath: string;
  filter?: S;
  counts: { status: S; _count: number }[];
  labels?: Record<S, string>;
}) {
  const countOf = (s: S) => counts.find((c) => c.status === s)?._count ?? 0;
  const tabs = [
    { label: "Бүгд", href: basePath, active: !filter, count: counts.reduce((sum, c) => sum + c._count, 0) },
    ...(Object.keys(labels) as S[]).map((s) => ({
      label: labels[s],
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

/** One request: title block, status + date, body, and the status/note form. */
export function RequestCard({
  kind,
  item,
  title,
  subtitle,
  children,
}: {
  kind: "quote" | "contact";
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
        </div>
        <div className="flex items-center gap-2 text-xs">
          {item.locale === "en" && (
            <span className="rounded-md bg-ink px-1.5 py-0.5 font-semibold text-bg">EN — англиар хариулна</span>
          )}
          <StatusBadge status={item.status} />
          <time className="text-muted" dateTime={item.createdAt.toISOString()}>
            {dateFormat.format(item.createdAt)}
          </time>
        </div>
      </div>

      {children}

      <form action={updateRequest} className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={item.id} />
        <select name="status" defaultValue={item.status} aria-label="Төлөв" className={`${adminInput} sm:w-40`}>
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
          className={`${adminInput} flex-1`}
        />
        <button className={adminButton}>Хадгалах</button>
      </form>
    </li>
  );
}

export function ContactLinks({ email, phone }: { email?: string | null; phone?: string | null }) {
  if (!email && !phone) {
    return <p className="mt-3 text-sm text-muted">Холбоо барих мэдээлэл үлдээгээгүй</p>;
  }
  return (
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
      {email && (
        <a href={`mailto:${email}`} className="text-brand hover:underline">
          {email}
        </a>
      )}
      {phone && (
        <a href={telHref(phone)} className="text-brand hover:underline">
          {phone}
        </a>
      )}
    </div>
  );
}

export const Loading = () => <p className="mt-6 text-muted">Ачаалж байна…</p>;
