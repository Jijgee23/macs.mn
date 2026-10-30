import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FileText, LifeBuoy, MessageSquare, PenLine } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { inquiryLabels } from "@/lib/mail";
import { adminSections } from "@/content/admin-labels";
import { dateFormat, Loading, StatusBadge } from "@/components/admin/Requests";
import { SupportStatusBadge } from "@/components/admin/SupportRequests";

export const metadata: Metadata = { title: "Хянах самбар" };

export default function DashboardPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Хянах самбар</h1>
      <Suspense fallback={<Loading />}>
        <Dashboard />
      </Suspense>
    </>
  );
}

async function Dashboard() {
  const admin = await requireAdmin();
  const [newQuotes, newMessages, newSupport, quotes, messages, support, recentEdits, label] = await Promise.all([
    db.quoteRequest.count({ where: { status: "NEW" } }),
    db.contactMessage.count({ where: { status: "NEW" } }),
    db.supportRequest.count({ where: { status: "NEW" } }),
    db.quoteRequest.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    db.supportRequest.findMany({ orderBy: { createdAt: "desc" }, take: 5, omit: { message: true } }),
    db.contentSection.findMany({
      where: { NOT: { updatedBy: "seed" } },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { key: true, locale: true, updatedAt: true, updatedBy: true },
    }),
    inquiryLabels(),
  ]);
  // A save writes the MN and EN rows together; list each section once.
  const edits = recentEdits.filter((e, i) => recentEdits.findIndex((x) => x.key === e.key) === i).slice(0, 5);
  const sectionTitle = (key: string) => adminSections.find((s) => s.key === key)?.title ?? key;

  const tiles = [
    { href: "/admin/requests?status=NEW", label: "Шинэ үнийн санал", value: newQuotes, icon: FileText },
    { href: "/admin/messages?status=NEW", label: "Шинэ санал хүсэлт", value: newMessages, icon: MessageSquare },
    { href: "/admin/support?status=NEW", label: "Шинэ хэрэглэгчийн хүсэлт", value: newSupport, icon: LifeBuoy },
  ];

  return (
    <>
      <p className="mt-1 text-sm text-muted">Сайн байна уу, {admin.name ?? admin.email}.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-brand"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <t.icon className="size-5" />
            </span>
            <span>
              <span className="block text-3xl font-bold">{t.value}</span>
              <span className="text-sm text-muted">{t.label}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Сүүлийн үнийн санал</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {quotes.length === 0 && <li className="py-3 text-muted">Хүсэлт алга.</li>}
            {quotes.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{q.company ?? q.name ?? q.email ?? q.phone ?? "Нэргүй"}</span>
                  <span className="block truncate text-xs text-muted">
                    {q.products.map(label.product).join(", ") || q.email || q.phone}
                  </span>
                </span>
                <StatusBadge status={q.status} />
              </li>
            ))}
          </ul>
          <Link href="/admin/requests" className="mt-3 inline-block text-sm text-brand hover:underline">
            Бүгдийг харах →
          </Link>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Сүүлийн санал хүсэлт</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {messages.length === 0 && <li className="py-3 text-muted">Мессеж алга.</li>}
            {messages.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{m.name ?? m.email ?? m.phone ?? "Нэргүй"}</span>
                  <span className="block truncate text-xs text-muted">{label.topic(m.topic)}</span>
                </span>
                <StatusBadge status={m.status} />
              </li>
            ))}
          </ul>
          <Link href="/admin/messages" className="mt-3 inline-block text-sm text-brand hover:underline">
            Бүгдийг харах →
          </Link>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Сүүлийн хэрэглэгчийн хүсэлт</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {support.length === 0 && <li className="py-3 text-muted">Хүсэлт алга.</li>}
            {support.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{r.company}</span>
                  <span className="block truncate text-xs text-muted">
                    {label.supportType(r.type)} · {label.urgency(r.urgency)}
                  </span>
                </span>
                <SupportStatusBadge status={r.status} />
              </li>
            ))}
          </ul>
          <Link href="/admin/support" className="mt-3 inline-block text-sm text-brand hover:underline">
            Бүгдийг харах →
          </Link>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <PenLine className="size-4 text-muted" /> Сүүлд засагдсан контент
          </h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {edits.length === 0 && <li className="py-3 text-muted">Одоогоор засвар алга.</li>}
            {edits.map((e) => (
              <li key={e.key} className="py-2.5">
                <Link href={`/admin/content/${e.key}`} className="font-medium hover:text-brand">
                  {sectionTitle(e.key)}
                </Link>
                <span className="block text-xs text-muted">
                  {dateFormat.format(e.updatedAt)} · {e.updatedBy}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/admin/content" className="mt-3 inline-block text-sm text-brand hover:underline">
            Контент засах →
          </Link>
        </section>
      </div>
    </>
  );
}
