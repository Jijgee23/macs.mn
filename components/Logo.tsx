import Link from "next/link";

export function Logo({ href = "/", label = "MACS ERP" }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label={label}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#b91c1c] to-[#7f1d1d] font-mono text-[11px] font-bold tracking-tight text-white shadow-[0_2px_8px_rgba(153,27,27,.3)]">
        IS
      </span>
      <span className="text-[15px] font-bold tracking-tight">
        MACS <span className="text-muted font-semibold">ERP</span>
      </span>
    </Link>
  );
}
