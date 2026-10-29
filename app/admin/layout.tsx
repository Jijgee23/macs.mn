import type { Metadata } from "next";
import { RootDocument } from "@/components/RootDocument";

export const metadata: Metadata = {
  title: { default: "Админ", template: "%s | MACS админ" },
  robots: { index: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <RootDocument lang="mn">{children}</RootDocument>;
}
