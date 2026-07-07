"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";

/**
 * AppShell: Sidebar + Header für die Disposition.
 * Auf den öffentlichen Token-Seiten (/erfassen, /unterschrift) wird das
 * Chrome komplett ausgeblendet — Mitarbeiter und Kunden sehen nur den
 * Inhalt ihres Links.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const oeffentlich =
    pathname.startsWith("/erfassen") ||
    pathname.startsWith("/unterschrift") ||
    pathname.startsWith("/offline");

  if (oeffentlich) {
    return (
      <main className="min-h-dvh px-[clamp(0.75rem,3vw,1.25rem)] py-[clamp(1rem,4vw,2.5rem)] print:p-0">
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,17rem)_1fr]">
      {/* ── Sidebar (Desktop) ─────────────────────────────────────── */}
      <aside className="hidden border-r border-line bg-card px-4 py-6 print:hidden lg:flex lg:flex-col xl:px-5">
        <BrandLogo />

        <nav className="mt-8 flex flex-1 flex-col gap-0.5 text-[clamp(0.85rem,2.2vw,0.95rem)]">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors",
              pathname === "/"
                ? "bg-surface font-medium"
                : "text-ink-soft hover:bg-surface hover:text-ink"
            )}
          >
            <LayoutGrid className="h-[18px] w-[18px]" /> Dashboard
          </Link>
        </nav>

        <div className="rounded-2xl bg-surface p-4 text-[clamp(0.8rem,2.2vw,0.875rem)] text-ink-soft">
          <p className="flex items-center gap-2 font-medium text-ink">
            <Link2 className="h-4 w-4" /> So funktioniert’s
          </p>
          <p className="mt-1.5">
            Links für Mitarbeiter und Kunden kopierst du direkt auf dem A4-Blatt — pro Person über das
            Namens-Dropdown, für den Kunden über „Kunden-Link kopieren“.
          </p>
        </div>
      </aside>

      {/* ── Mobile-Header + Inhalt ───────────────────────────────── */}
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-card/90 px-[clamp(0.75rem,3vw,1rem)] py-2.5 backdrop-blur print:hidden lg:hidden">
          <BrandLogo />
        </header>
        <main className="flex-1 px-[clamp(0.75rem,3vw,1.25rem)] py-[clamp(1rem,4vw,2.5rem)] print:p-0 lg:px-8 xl:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
