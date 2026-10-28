import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { productLabel } from "@/lib/mail";
import { telHref } from "@/content/common";
import { AdminShell, isStatus, RequestCard, StatusFilter } from "./ui";

export const metadata: Metadata = {
  title: "Үнийн саналын хүсэлтүүд",
};

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <AdminShell active="/admin">
      <Suspense fallback={<p className="mt-6 text-muted">Ачаалж байна…</p>}>
        <QuoteList searchParams={searchParams} />
      </Suspense>
    </AdminShell>
  );
}

async function QuoteList({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  await requireAdmin();

  const { status } = await searchParams;
  const filter = isStatus(status) ? status : undefined;

  const [quotes, counts] = await Promise.all([
    db.quoteRequest.findMany({
      where: filter ? { status: filter } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.quoteRequest.groupBy({ by: ["status"], _count: true }),
  ]);

  return (
    <>
      <StatusFilter basePath="/admin" filter={filter} counts={counts} />

      {quotes.length === 0 ? (
        <p className="mt-10 text-center text-muted">Хүсэлт алга.</p>
      ) : (
        <ul className="mt-6 grid gap-4 xl:grid-cols-2">
          {quotes.map((q) => (
            <RequestCard
              key={q.id}
              kind="quote"
              item={q}
              title={q.company ?? q.name ?? q.email}
              subtitle={q.company ? q.name : null}
            >
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <a href={`mailto:${q.email}`} className="text-brand hover:underline">
                  {q.email}
                </a>
                <a href={telHref(q.phone)} className="text-brand hover:underline">
                  {q.phone}
                </a>
              </div>
              {q.products.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {q.products.map((p) => (
                    <li key={p} className="rounded-md bg-soft px-2 py-0.5 text-xs">
                      {productLabel(p)}
                    </li>
                  ))}
                </ul>
              )}
              {q.message && <p className="mt-3 whitespace-pre-line text-sm">{q.message}</p>}
            </RequestCard>
          ))}
        </ul>
      )}
    </>
  );
}
