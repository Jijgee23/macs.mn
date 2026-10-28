import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Locales — Mongolian is served at the root ("/une-sanal") by rewriting to app/[lang]
 * with lang=mn; English lives at "/en/...". "/mn/..." redirects to the root URL so
 * each page has one address. Keep in sync with lib/locale.ts.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
