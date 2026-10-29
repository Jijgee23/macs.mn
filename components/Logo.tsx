import Image from "next/image";
import Link from "next/link";
import logo from "@/public/macs-logo.svg";

export function Logo({ href = "/", label = "MACS ERP" }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label={label}>
      <Image src={logo} alt="" width={34} height={34} priority className="size-[34px] shrink-0" />
      <span className="text-[15px] font-bold tracking-tight">
        MACS <span className="text-muted font-semibold">ERP</span>
      </span>
    </Link>
  );
}
