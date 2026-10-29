"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePost } from "@/app/admin/posts-actions";

export function DeletePostButton({ id, title }: { id: string; title: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      title="Устгах"
      onClick={() => {
        if (confirm(`«${title}» нийтлэлийг устгах уу? Буцаах боломжгүй.`)) start(() => deletePost(id));
      }}
      className="flex size-8 items-center justify-center rounded-full border border-line text-muted hover:border-brand hover:text-brand disabled:opacity-50"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}
