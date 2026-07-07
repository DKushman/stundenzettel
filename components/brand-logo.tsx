import Image from "next/image";
import Link from "next/link";

const LOGO = "/Bni-Praesentation (1).png";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={className} aria-label="StaffConnect — Startseite">
      <Image
        src={LOGO}
        alt="StaffConnect"
        width={240}
        height={72}
        priority
        className="h-[clamp(2.75rem,9vw,3.75rem)] w-auto max-w-[min(100%,15rem)] object-contain object-left"
      />
    </Link>
  );
}
