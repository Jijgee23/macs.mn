import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { Loading } from "@/components/admin/Requests";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const metadata: Metadata = { title: "Миний бүртгэл" };

export default function AccountPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Миний бүртгэл</h1>
      <Suspense fallback={<Loading />}>
        <Account />
      </Suspense>
    </>
  );
}

async function Account() {
  const me = await requireAdmin();
  return (
    <div className="mt-6 max-w-md space-y-6">
      <p className="text-sm text-muted">
        {me.name ? `${me.name} · ` : ""}
        {me.email}
      </p>
      <ChangePasswordForm />
    </div>
  );
}
