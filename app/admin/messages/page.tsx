import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { topicLabel } from "@/lib/mail";
import { telHref } from "@/content/common";
import { AdminShell, isStatus, RequestCard, StatusFilter } from "../ui";

export const metadata: Metadata = {
  title: "Санал хүсэлтүүд",
};

export default function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  return (
    <AdminShell active="/admin/messages">
      <Suspense fallback={<p className="mt-6 text-muted">Ачаалж байна…</p>}>
        <MessageList searchParams={searchParams} />
      </Suspense>
    </AdminShell>
  );
}

async function MessageList({ searchParams }: { searchParams: PageProps<"/admin/messages">["searchParams"] }) {
  await requireAdmin();

  const { status } = await searchParams;
  const filter = isStatus(status) ? status : undefined;

  const [messages, counts] = await Promise.all([
    db.contactMessage.findMany({
      where: filter ? { status: filter } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.contactMessage.groupBy({ by: ["status"], _count: true }),
  ]);

  return (
    <>
      <StatusFilter basePath="/admin/messages" filter={filter} counts={counts} />

      {messages.length === 0 ? (
        <p className="mt-10 text-center text-muted">Мессеж алга.</p>
      ) : (
        <ul className="mt-6 grid gap-4 xl:grid-cols-2">
          {messages.map((m) => (
            <RequestCard
              key={m.id}
              kind="contact"
              item={m}
              title={m.name ?? m.email}
              subtitle={topicLabel(m.topic)}
            >
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <a href={`mailto:${m.email}`} className="text-brand hover:underline">
                  {m.email}
                </a>
                {m.phone && (
                  <a href={telHref(m.phone)} className="text-brand hover:underline">
                    {m.phone}
                  </a>
                )}
              </div>
              <p className="mt-3 whitespace-pre-line text-sm">{m.message}</p>
            </RequestCard>
          ))}
        </ul>
      )}
    </>
  );
}
