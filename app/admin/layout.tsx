import type { Metadata } from "next";
import { RootDocument } from "@/components/RootDocument";

export const metadata: Metadata = {
  title: { default: "Админ", template: "%s | MACS ERP" },
  robots: { index: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <RootDocument lang="mn">{children}</RootDocument>;
}
