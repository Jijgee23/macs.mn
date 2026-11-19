import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ContactLinks, isStatus, Loading, RequestCard, StatusFilter } from "@/components/admin/Requests";

export const metadata: Metadata = { title: "Гэрээний хүсэлт" };

export default function ContractRequestsPage({ searchParams }: PageProps<"/admin/contracts">) {
  return (
    <>
      <h1 className="text-2xl font-bold">Гэрээний хүсэлтүүд</h1>
      <Suspense fallback={<Loading />}>
        <ContractList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ContractList({ searchParams }: { searchParams: PageProps<"/admin/contracts">["searchParams"] }) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter = isStatus(status) ? status : undefined;

  const [contracts, counts] = await Promise.all([
    db.contractRequest.findMany({ where: filter ? { status: filter } : undefined, orderBy: { createdAt: "desc" }, take: 200 }),
    db.contractRequest.groupBy({ by: ["status"], _count: true }),
  ]);

  return (
    <>
      <StatusFilter basePath="/admin/contracts" filter={filter} counts={counts} />
      {contracts.length === 0 ? (
        <p className="mt-10 text-center text-muted">Хүсэлт алга.</p>
      ) : (
        <ul className="mt-6 grid gap-4 xl:grid-cols-2">
          {contracts.map((c) => {
            const person = c.applicantType === "PERSON";
            return (
            <RequestCard key={c.id} kind="contract" item={c} title={c.orgName} subtitle={`${person ? "Хувь хүн" : "Байгууллага"} · Регистр: ${c.regNo}`}>
              <ContactLinks email={c.email} phone={c.phone} />
              <dl className="mt-3 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
                {!person && (
                  <>
                    <dt className="text-muted">Гэрээ батлах</dt>
                    <dd>
                      {c.approverLastName} {c.approverFirstName} — {c.approverPosition}, {c.approverPhone}
                    </dd>
                    <dt className="text-muted">Төлөөлөх</dt>
                    <dd>
                      {c.repLastName} {c.repFirstName} — {c.repPosition}, {c.repPhone}
                    </dd>
                  </>
                )}
                <dt className="text-muted">Хаяг</dt>
                <dd>{c.address}</dd>
                <dt className="text-muted">Хэрэглэгч</dt>
                <dd>{c.userCount}</dd>
              </dl>
              {c.products.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {c.products.map((p) => (
                    <li key={p} className="rounded-md bg-soft px-2 py-0.5 text-xs">
                      {p}
                    </li>
                  ))}
                </ul>
              )}
              {c.message && <p className="mt-3 text-sm whitespace-pre-line">{c.message}</p>}
            </RequestCard>
            );
          })}
        </ul>
      )}
    </>
  );
}
