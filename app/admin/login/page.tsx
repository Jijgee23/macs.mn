import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, FileText, Newspaper, PenLine, Users } from "lucide-react";
import { currentAdmin, safeNext } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Нэвтрэх" };

const features = [
  { icon: PenLine, text: "Сайтын текстийг монгол, англиар засах" },
  { icon: Newspaper, text: "Мэдээ, зөвлөмж нийтэлж хуваалцах" },
  { icon: FileText, text: "Үнийн санал, санал хүсэлтэд хариу өгөх" },
  { icon: Users, text: "Админ эрхүүдийг удирдах" },
];

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <div className="grid min-h-svh flex-1 lg:grid-cols-[1fr_1.1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-[#0b0b0f] p-12 text-white lg:flex lg:flex-col">
        <div aria-hidden className="absolute -top-40 -left-40 size-[32rem] rounded-full bg-[#6E122F] opacity-50 blur-3xl" />
        <div aria-hidden className="absolute -right-24 -bottom-32 size-80 rounded-full bg-[#b91c1c] opacity-25 blur-3xl" />
        <div className="relative flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/macs-logo.svg" alt="" className="size-10" />
          <span className="text-lg font-bold tracking-tight">
            MACS <span className="font-semibold text-white/60">ERP</span>
          </span>
        </div>
        <div className="relative mt-auto max-w-md">
          <h2 className="text-4xl leading-tight font-bold tracking-[-0.02em]">macs.mn удирдлагын самбар</h2>
          <ul className="mt-8 space-y-4">
            {features.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-white/80">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white/10">
                  <f.icon className="size-4" />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative mt-auto pt-12 text-xs text-white/40">© InfoSystems Mongolia ХХК</p>
      </aside>

      {/* Form */}
      <main className="flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" /> macs.mn
          </Link>
          <ThemeToggle label="Өнгөний горим" />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <div className="lg:hidden">
            <Logo href="/" label="MACS ERP" />
          </div>
          <h1 className="mt-8 text-2xl font-bold tracking-tight lg:mt-0">Нэвтрэх</h1>
          <p className="mt-1.5 text-sm text-muted">Админ бүртгэлээрээ нэвтэрнэ үү.</p>
          <Suspense fallback={<LoginForm next="/admin" />}>
            <LoginGate searchParams={searchParams} />
          </Suspense>
          <p className="mt-8 border-t border-line pt-5 text-xs leading-relaxed text-muted">
            Нууц үгээ мартсан бол өөр админд хандаарай — «Админ эрхүүд» хэсгээс таны нууц үгийг шинэчилж өгнө.
          </p>
        </div>
      </main>
    </div>
  );
}

/** Already signed in → straight to the requested page; otherwise the form. */
async function LoginGate({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const { next } = await searchParams;
  const target = safeNext(next);
  if (await currentAdmin()) redirect(target);
  return <LoginForm next={target} />;
}
