import type { ReactNode } from "react";
import type { SupportStatus } from "@prisma/client";
import { Paperclip } from "lucide-react";
import { updateSupportRequest } from "@/app/admin/actions";
import type { SupportUrgency } from "@/content/common";
import { dateFormat } from "./Requests";
import { adminButton, adminInput } from "./styles";

export const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  NEW: "Шинэ",
  RECEIVED: "Хүлээн авсан",
  IN_PROGRESS: "Хийгдэж байна",
  RESOLVED: "Шийдвэрлэсэн",
  REJECTED: "Татгалзсан",
};

const STATUS_STYLES: Record<SupportStatus, string> = {
  NEW: "bg-brand-soft text-brand",
  RECEIVED: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  IN_PROGRESS: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  RESOLVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  REJECTED: "bg-soft text-muted",
};

const URGENCY_STYLES: Record<SupportUrgency, string> = {
  low: "border-line text-muted",
  normal: "border-line text-ink",
  high: "border-amber-400 text-amber-700 dark:text-amber-300",
  critical: "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const supportStatuses = Object.keys(SUPPORT_STATUS_LABELS) as SupportStatus[];

export function isSupportStatus(value: unknown): value is SupportStatus {
  return typeof value === "string" && value in SUPPORT_STATUS_LABELS;
}

export function SupportStatusBadge({ status }: { status: SupportStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {SUPPORT_STATUS_LABELS[status]}
    </span>
  );
}

export function UrgencyBadge({ urgency, label }: { urgency: string; label: string }) {
  const style = URGENCY_STYLES[urgency as SupportUrgency] ?? URGENCY_STYLES.normal;
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}>{label}</span>;
}

type Item = {
  id: string;
  status: SupportStatus;
  note: string | null;
  reply: string | null;
  emails: string[];
  locale: string;
  createdAt: Date;
  attachments: { id: string; name: string; size: number }[];
};

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** One customer request: header, body, attachments, and the status / note / reply form. */
export function SupportCard({
  item,
  title,
  subtitle,
  badges,
  children,
}: {
  item: Item;
  title: string;
  subtitle?: string | null;
  badges: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{title}</p>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {item.locale === "en" && (
            <span className="rounded-md bg-ink px-1.5 py-0.5 font-semibold text-bg">EN — англиар хариулна</span>
          )}
          {badges}
          <SupportStatusBadge status={item.status} />
          <time className="text-muted" dateTime={item.createdAt.toISOString()}>
            {dateFormat.format(item.createdAt)}
          </time>
        </div>
      </div>

      {children}

      {item.attachments.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {item.attachments.map((a) => (
            <li key={a.id}>
              <a
                href={`/admin/files/${a.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 hover:border-brand hover:text-brand"
              >
                <Paperclip className="size-3.5" aria-hidden />
                {a.name} <span className="text-xs text-muted">{formatSize(a.size)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {item.reply && (
        <p className="mt-3 rounded-lg bg-soft px-3 py-2 text-sm">
          <span className="text-muted">Сүүлд илгээсэн тайлбар: </span>
          {item.reply}
        </p>
      )}

      <form action={updateSupportRequest} className="mt-4 grid gap-2 border-t border-line pt-4">
        <input type="hidden" name="id" value={item.id} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <select name="status" defaultValue={item.status} aria-label="Төлөв" className={`${adminInput} sm:w-44`}>
            {supportStatuses.map((s) => (
              <option key={s} value={s}>
                {SUPPORT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <input
            name="note"
            defaultValue={item.note ?? ""}
            placeholder="Дотоод тэмдэглэл (хэрэглэгчид харагдахгүй)"
            aria-label="Дотоод тэмдэглэл"
            className={`${adminInput} flex-1`}
          />
        </div>
        <textarea
          name="reply"
          rows={2}
          placeholder="Хэрэглэгчид илгээх тайлбар (заавал биш) — юу хийсэн, хэзээ дуусах гэх мэт"
          aria-label="Хэрэглэгчид илгээх тайлбар"
          className={`${adminInput} field-sizing-content`}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="notify" defaultChecked className="size-4 accent-brand" />
            Төлөв солигдвол / тайлбар бичвэл {item.emails.join(", ")} руу имэйлээр мэдэгдэх
          </label>
          <button className={adminButton}>Хадгалах</button>
        </div>
      </form>
    </li>
  );
}
