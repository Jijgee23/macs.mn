import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Нэвтрэх" };

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-8 shadow-pop">
        <Logo href="/admin" label="MACS админ" />
        <h1 className="mt-6 text-xl font-bold">Админ нэвтрэх</h1>
        <p className="mt-1 text-sm text-muted">macs.mn контент, хүсэлтүүдийг удирдах</p>
        <LoginForm />
      </div>
    </div>
  );
}
