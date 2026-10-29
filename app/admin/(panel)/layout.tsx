import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminNav, AdminNavLinks } from "@/components/admin/AdminNav";
import { logout } from "../actions";

async function CurrentUser() {
  const admin = await requireAdmin();
  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href="/admin/account" className="hidden text-muted hover:text-ink sm:inline">
        {admin.name ?? admin.email}
      </Link>
      <form action={logout}>
        <button className="text-brand hover:underline">Гарах</button>
      </form>
    </div>
  );
}

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="container-wide flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo href="/admin" label="MACS админ" />
            <span className="rounded-md bg-soft px-2 py-0.5 text-xs font-semibold text-muted">Админ</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" className="hidden items-center gap-1 text-sm text-muted hover:text-ink sm:inline-flex">
              Сайт <ExternalLink className="size-3.5" />
            </a>
            <ThemeToggle label="Өнгөний горим" />
            <Suspense fallback={null}>
              <CurrentUser />
            </Suspense>
          </div>
        </div>
        <div className="container-wide">
          <Suspense fallback={<AdminNavLinks pathname="" />}>
            <AdminNav />
          </Suspense>
        </div>
      </header>
      <main className="container-wide flex-1 py-8">{children}</main>
    </>
  );
}
