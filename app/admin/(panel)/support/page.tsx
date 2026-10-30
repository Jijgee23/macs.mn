import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { inquiryLabels } from "@/lib/mail";
import { ContactLinks, Loading, StatusFilter } from "@/components/admin/Requests";
import { isSupportStatus, SUPPORT_STATUS_LABELS, SupportCard, UrgencyBadge } from "@/components/admin/SupportRequests";

export const metadata: Metadata = { title: "Хэрэглэгчийн хүсэлт" };

export default function SupportRequestsPage({ searchParams }: PageProps<"/admin/support">) {
  return (
    <>
      <h1 className="text-2xl font-bold">MACS хэрэглэгчийн хүсэлтүүд</h1>
      <Suspense fallback={<Loading />}>
        <SupportList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function SupportList({ searchParams }: { searchParams: PageProps<"/admin/support">["searchParams"] }) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter = isSupportStatus(status) ? status : undefined;

  const [requests, counts, label] = await Promise.all([
    db.supportRequest.findMany({
      where: filter ? { status: filter } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { attachments: { select: { id: true, name: true, size: true }, orderBy: { createdAt: "asc" } } },
    }),
    db.supportRequest.groupBy({ by: ["status"], _count: true }),
    inquiryLabels(),
  ]);

  return (
    <>
      <StatusFilter basePath="/admin/support" filter={filter} counts={counts} labels={SUPPORT_STATUS_LABELS} />
      {requests.length === 0 ? (
        <p className="mt-10 text-center text-muted">Хүсэлт алга.</p>
      ) : (
        <ul className="mt-6 grid gap-4 xl:grid-cols-2">
          {requests.map((r) => (
            <SupportCard
              key={r.id}
              item={r}
              title={r.company}
              subtitle={[label.supportType(r.type), r.name, `#${r.id.slice(-8).toUpperCase()}`].filter(Boolean).join(" · ")}
              badges={<UrgencyBadge urgency={r.urgency} label={label.urgency(r.urgency)} />}
            >
              <ContactLinks phone={r.phone} />
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {r.emails.map((email) => (
                  <a key={email} href={`mailto:${email}`} className="text-brand hover:underline">
                    {email}
                  </a>
                ))}
              </div>
              <p className="mt-3 text-sm whitespace-pre-line">{r.message}</p>
            </SupportCard>
          ))}
        </ul>
      )}
    </>
  );
}
