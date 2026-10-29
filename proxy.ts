import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 1. /admin/* — fast UX-level redirect only, NOT the real auth check. Every admin page
 *    and Server Action calls requireAdmin() (lib/auth.ts). Cookie name must match
 *    SESSION_COOKIE there.
 * 2. Locales — Mongolian is served at the root ("/une-sanal") by rewriting to app/[lang]
 *    with lang=mn; English lives at "/en/...". "/mn/..." redirects to the root URL so
 *    each page has one address. Keep in sync with lib/locale.ts.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const isLoginPage = pathname === "/admin/login";
    if (!isLoginPage && !request.cookies.has("macs_site_admin_session")) {
      // Come back to the requested page after login (validated by safeNext in lib/auth.ts).
      const login = new URL("/admin/login", request.url);
      if (pathname !== "/admin") login.searchParams.set("next", pathname + request.nextUrl.search);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  // Uploaded images (app/media/[id]/route.ts) and the sitemap aren't localized.
  if (pathname.startsWith("/media/") || pathname === "/sitemap.xml") {
    return NextResponse.next();
  }

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return NextResponse.next();
  }

  if (pathname === "/mn" || pathname.startsWith("/mn/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/mn${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals and files with an extension (favicon.ico, images, …).
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
