import type { ReactNode } from "react";
import { Golos_Text } from "next/font/google";
import "@/app/globals.css";

const golosText = Golos_Text({
  variable: "--font-golos",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "900"],
});

// Light is the default; only a saved "dark" choice (ThemeToggle) switches it, before first paint.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("macs-theme");if(t==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}})()`;

/** <html>/<body> shell shared by the public site and admin root layouts. */
export function RootDocument({ lang, children }: { lang: string; children: ReactNode }) {
  return (
    <html
      lang={lang}
      data-theme="light"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${golosText.variable} h-full antialiased`}
    >
      {/* Rendered only from root layouts, where a plain <head> is correct. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
