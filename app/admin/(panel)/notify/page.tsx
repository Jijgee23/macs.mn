import type { Metadata } from "next";
import { Suspense } from "react";
import { Lock } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PRIMARY_NOTIFY_EMAIL } from "@/lib/mail";
import { dateFormat, Loading } from "@/components/admin/Requests";
import { AddRecipientForm, DeleteRecipientButton, EditRecipientForm } from "./forms";

export const metadata: Metadata = { title: "Мэдэгдлийн имэйл" };

export default function NotifyPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Мэдэгдлийн имэйл</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Үнийн санал, санал хүсэлт, хэрэглэгчийн хүсэлт ирэх бүрт эдгээр хаяг руу мэдэгдэл очно. Хүсэлт илгээгч
        тусдаа баталгаажуулах имэйл авах ба энэ жагсаалтыг харахгүй. Мэдэгдэл дээр «Reply» дарахад хариу шууд
        илгээгч рүү очно.
      </p>
      <Suspense fallback={<Loading />}>
        <Recipients />
      </Suspense>
    </>
  );
}

async function Recipients() {
  await requireAdmin();
  const extra = await db.notifyRecipient.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <ul className="space-y-3">
        <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-5">
          <div>
            <p className="font-semibold">{PRIMARY_NOTIFY_EMAIL}</p>
            <p className="mt-1 text-xs text-muted">Үндсэн хаяг · хэрэглэгчийн хариу энэ хаяг руу очно</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-md bg-soft px-2 py-0.5 text-xs text-muted">
            <Lock className="size-3" /> Заавал
          </span>
        </li>
        {extra.map((r) => (
          <li key={r.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{r.email}</p>
                <p className="mt-1 text-xs text-muted">
                  Нэмэгдсэн: {dateFormat.format(r.createdAt)}
                  {r.createdBy ? ` · ${r.createdBy}` : ""}
                </p>
              </div>
              <DeleteRecipientButton id={r.id} email={r.email} />
            </div>
            <EditRecipientForm id={r.id} email={r.email} />
          </li>
        ))}
      </ul>
      <AddRecipientForm />
    </div>
  );
}
