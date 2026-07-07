import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HinweisCard({
  icon,
  titel,
  text,
  linkHref,
  linkText,
}: {
  icon?: React.ReactNode;
  titel: string;
  text: string;
  linkHref?: string;
  linkText?: string;
}) {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-line bg-card p-8 text-center shadow-card">
      {icon && (
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface">
          {icon}
        </span>
      )}
      <h1 className="text-xl font-semibold">{titel}</h1>
      <p className="mt-2 text-[15px] text-ink-soft">{text}</p>
      {linkHref && linkText && (
        <Link href={linkHref} className="mt-6 inline-block">
          <Button variant="secondary">{linkText}</Button>
        </Link>
      )}
    </div>
  );
}
