import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { adminSections } from "@/content/admin-labels";
import { dateFormat, Loading } from "@/components/admin/Requests";

export const metadata: Metadata = { title: "Контент" };

export default function ContentListPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Контент</h1>
      <p className="mt-1 text-sm text-muted">
        Сайтын текстийг монгол, англи хэлээр засна. Хадгалмагц macs.mn дээр шууд шинэчлэгдэнэ.
      </p>
      <Suspense fallback={<Loading />}>
        <SectionList />
      </Suspense>
    </>
  );
}

async function SectionList() {
  await requireAdmin();
  const rows = await db.contentSection.groupBy({ by: ["key"], _max: { updatedAt: true } });
  const updated = new Map(rows.map((r) => [r.key, r._max.updatedAt]));

  return (
    <ul className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {adminSections.map((s) => {
        const at = updated.get(s.key);
        return (
          <li key={s.key}>
            <Link
              href={`/admin/content/${s.key}`}
              className="group flex h-full items-center gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-brand"
            >
              <div className="flex-1">
                <p className="font-semibold">{s.title}</p>
                <p className="mt-1 text-sm text-muted">{s.description}</p>
                <p className="mt-2 text-xs text-muted">{at ? `Засагдсан: ${dateFormat.format(at)}` : "Анхны текст"}</p>
              </div>
              <ChevronRight className="size-4 text-muted group-hover:text-brand" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
