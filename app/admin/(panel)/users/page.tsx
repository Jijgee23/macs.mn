import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { dateFormat, Loading } from "@/components/admin/Requests";
import { AddAdminForm, DeleteAdminButton, SetPasswordForm } from "./forms";

export const metadata: Metadata = { title: "Админууд" };

export default function UsersPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Админууд</h1>
      <p className="mt-1 text-sm text-muted">Админ бүр контент засах, хүсэлт харах, бусад админыг удирдах эрхтэй.</p>
      <Suspense fallback={<Loading />}>
        <Users />
      </Suspense>
    </>
  );
}

async function Users() {
  const me = await requireAdmin();
  const users = await db.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  const lastOne = users.length <= 1;

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <ul className="space-y-3">
        {users.map((u) => (
          <li key={u.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {u.name ?? u.email}
                  {u.id === me.id && <span className="ml-2 rounded-md bg-soft px-1.5 py-0.5 text-xs text-muted">та</span>}
                </p>
                {u.name && <p className="text-sm text-muted">{u.email}</p>}
                <p className="mt-1 text-xs text-muted">
                  Нэмэгдсэн: {dateFormat.format(u.createdAt)} · Сүүлд нэвтэрсэн:{" "}
                  {u.lastLoginAt ? dateFormat.format(u.lastLoginAt) : "—"}
                </p>
              </div>
              {u.id !== me.id && !lastOne && <DeleteAdminButton id={u.id} email={u.email} />}
            </div>
            {u.id !== me.id && <SetPasswordForm id={u.id} />}
          </li>
        ))}
      </ul>
      <AddAdminForm />
    </div>
  );
}
