import Image from "next/image";
import Link from "next/link";

const LOGO = "/Bni-Praesentation (1).png";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={className} aria-label="StaffConnect — Startseite">
      <Image
        src={LOGO}
        alt="StaffConnect"
        width={168}
        height={48}
        priority
        className="h-[clamp(2rem,6vw,2.5rem)] w-auto max-w-[min(100%,10.5rem)] object-contain object-left"
      />
    </Link>
  );
}
