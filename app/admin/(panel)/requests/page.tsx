import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { inquiryLabels } from "@/lib/mail";
import { ContactLinks, isStatus, Loading, RequestCard, StatusFilter } from "@/components/admin/Requests";

export const metadata: Metadata = { title: "Үнийн санал" };

export default function QuoteRequestsPage({ searchParams }: PageProps<"/admin/requests">) {
  return (
    <>
      <h1 className="text-2xl font-bold">Үнийн саналын хүсэлтүүд</h1>
      <Suspense fallback={<Loading />}>
        <QuoteList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function QuoteList({ searchParams }: { searchParams: PageProps<"/admin/requests">["searchParams"] }) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter = isStatus(status) ? status : undefined;

  const [quotes, counts, label] = await Promise.all([
    db.quoteRequest.findMany({ where: filter ? { status: filter } : undefined, orderBy: { createdAt: "desc" }, take: 200 }),
    db.quoteRequest.groupBy({ by: ["status"], _count: true }),
    inquiryLabels(),
  ]);

  return (
    <>
      <StatusFilter basePath="/admin/requests" filter={filter} counts={counts} />
      {quotes.length === 0 ? (
        <p className="mt-10 text-center text-muted">Хүсэлт алга.</p>
      ) : (
        <ul className="mt-6 grid gap-4 xl:grid-cols-2">
          {quotes.map((q) => (
            <RequestCard key={q.id} kind="quote" item={q} title={q.company ?? q.name ?? q.email} subtitle={q.company ? q.name : null}>
              <ContactLinks email={q.email} phone={q.phone} />
              {q.products.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {q.products.map((p) => (
                    <li key={p} className="rounded-md bg-soft px-2 py-0.5 text-xs">
                      {label.product(p)}
                    </li>
                  ))}
                </ul>
              )}
              {q.message && <p className="mt-3 text-sm whitespace-pre-line">{q.message}</p>}
            </RequestCard>
          ))}
        </ul>
      )}
    </>
  );
}
