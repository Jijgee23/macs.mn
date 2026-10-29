import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RootDocument } from "@/components/RootDocument";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getContentFor } from "@/lib/content";
import { isLocale, locales } from "@/lib/locale";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const t = await getContentFor(lang);
  return {
    metadataBase: new URL(process.env.SITE_URL ?? "https://macs.mn"),
    title: { default: t.meta.title, template: "%s | MACS ERP" },
    description: t.meta.description,
    openGraph: { siteName: "MACS ERP", locale: t.meta.ogLocale, type: "website" },
  };
}

export default async function SiteLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <RootDocument lang={lang}>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </RootDocument>
  );
}
