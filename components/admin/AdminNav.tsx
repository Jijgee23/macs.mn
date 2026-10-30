"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Хянах самбар" },
  { href: "/admin/content", label: "Контент" },
  { href: "/admin/posts", label: "Нийтлэл" },
  { href: "/admin/content/faq", label: "FAQ" },
  { href: "/admin/requests", label: "Үнийн санал" },
  { href: "/admin/messages", label: "Санал хүсэлт" },
  { href: "/admin/support", label: "Хэрэглэгчийн хүсэлт" },
  { href: "/admin/users", label: "Админ эрхүүд" },
];

/** Highlights the current section; must sit inside <Suspense> (usePathname on dynamic routes). */
export function AdminNav() {
  return <AdminNavLinks pathname={usePathname()} />;
}

/** Also the Suspense fallback, with an empty pathname (nothing highlighted). */
export function AdminNavLinks({ pathname }: { pathname: string }) {
  // The most specific matching link wins, so /admin/content/faq highlights FAQ, not Контент.
  const matches = links.filter((l) => pathname === l.href || pathname.startsWith(`${l.href}/`));
  const activeHref = matches.sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto text-sm" aria-label="Админ цэс">
      {links.map((l) => {
        const active = l.href === activeHref;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`shrink-0 border-b-2 px-3 py-3 font-medium ${
              active ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
