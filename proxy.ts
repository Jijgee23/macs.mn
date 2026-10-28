import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 1. /admin/* — fast UX-level redirect only, NOT the real auth check. Every admin page
 *    and Server Action must independently call requireAdmin() (see lib/auth.ts).
 *    Cookie name must match SESSION_COOKIE in lib/auth.ts.
 * 2. Locales — Mongolian is served at the root ("/une-sanal") by rewriting to app/[lang]
 *    with lang=mn; English lives at "/en/...". "/mn/..." redirects to the root URL so
 *    each page has one address. Keep in sync with lib/locale.ts.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const isLoginPage = pathname === "/admin/login";
    const hasSession = request.cookies.has("macs_site_admin_session");
    if (!isLoginPage && !hasSession) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
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
