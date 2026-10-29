import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { inquiryLabels } from "@/lib/mail";
import { ContactLinks, isStatus, Loading, RequestCard, StatusFilter } from "@/components/admin/Requests";

export const metadata: Metadata = { title: "Санал хүсэлт" };

export default function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  return (
    <>
      <h1 className="text-2xl font-bold">Санал хүсэлтүүд</h1>
      <Suspense fallback={<Loading />}>
        <MessageList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function MessageList({ searchParams }: { searchParams: PageProps<"/admin/messages">["searchParams"] }) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter = isStatus(status) ? status : undefined;

  const [messages, counts, label] = await Promise.all([
    db.contactMessage.findMany({ where: filter ? { status: filter } : undefined, orderBy: { createdAt: "desc" }, take: 200 }),
    db.contactMessage.groupBy({ by: ["status"], _count: true }),
    inquiryLabels(),
  ]);

  return (
    <>
      <StatusFilter basePath="/admin/messages" filter={filter} counts={counts} />
      {messages.length === 0 ? (
        <p className="mt-10 text-center text-muted">Мессеж алга.</p>
      ) : (
        <ul className="mt-6 grid gap-4 xl:grid-cols-2">
          {messages.map((m) => (
            <RequestCard key={m.id} kind="contact" item={m} title={m.name ?? m.email ?? m.phone ?? "Нэргүй"} subtitle={label.topic(m.topic)}>
              <ContactLinks email={m.email} phone={m.phone} />
              <p className="mt-3 text-sm whitespace-pre-line">{m.message}</p>
            </RequestCard>
          ))}
        </ul>
      )}
    </>
  );
}
