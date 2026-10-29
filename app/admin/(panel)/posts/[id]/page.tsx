import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PostForm } from "@/components/admin/PostForm";
import { Loading } from "@/components/admin/Requests";

export const metadata: Metadata = { title: "Нийтлэл засах" };

export default function EditPostPage({ params }: PageProps<"/admin/posts/[id]">) {
  return (
    <>
      <Link href="/admin/posts" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-3.5" /> Нийтлэл
      </Link>
      <h1 className="mt-3 mb-6 text-2xl font-bold">Нийтлэл засах</h1>
      <Suspense fallback={<Loading />}>
        <EditPost params={params} />
      </Suspense>
    </>
  );
}

async function EditPost({ params }: { params: PageProps<"/admin/posts/[id]">["params"] }) {
  await requireAdmin();
  const { id } = await params;
  const p = await db.post.findUnique({ where: { id } });
  if (!p) notFound();

  return (
    <PostForm
      key={p.id}
      id={p.id}
      initial={{
        category: p.category,
        status: p.status,
        slug: p.slug,
        titleMn: p.titleMn,
        excerptMn: p.excerptMn,
        bodyMn: p.bodyMn,
        titleEn: p.titleEn ?? "",
        excerptEn: p.excerptEn ?? "",
        bodyEn: p.bodyEn ?? "",
        coverId: p.coverId,
      }}
    />
  );
}
