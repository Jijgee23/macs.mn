import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Админ нэвтрэх",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-8">
        <Logo />
        <h1 className="mt-6 text-xl font-bold">Админ нэвтрэх</h1>
        <LoginForm />
      </div>
    </div>
  );
}
