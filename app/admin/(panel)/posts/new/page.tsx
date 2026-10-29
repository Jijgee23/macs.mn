import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { PostForm } from "@/components/admin/PostForm";
import { Loading } from "@/components/admin/Requests";

export const metadata: Metadata = { title: "Шинэ нийтлэл" };

export default function NewPostPage() {
  return (
    <>
      <Link href="/admin/posts" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-3.5" /> Нийтлэл
      </Link>
      <h1 className="mt-3 mb-6 text-2xl font-bold">Шинэ нийтлэл</h1>
      <Suspense fallback={<Loading />}>
        <NewPost />
      </Suspense>
    </>
  );
}

async function NewPost() {
  await requireAdmin();
  return (
    <PostForm
      id={null}
      initial={{
        category: "NEWS",
        status: "DRAFT",
        slug: "",
        titleMn: "",
        excerptMn: "",
        bodyMn: "",
        titleEn: "",
        excerptEn: "",
        bodyEn: "",
        coverId: null,
      }}
    />
  );
}
