"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Asterisk, LayoutGrid, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <main className="min-h-dvh px-4 py-6 lg:px-10 lg:py-10 print:p-0">{children}</main>
    );
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[280px_1fr]">
      {/* ── Sidebar (Desktop) ─────────────────────────────────────── */}
      <aside className="hidden border-r border-line bg-card px-5 py-6 print:hidden lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-3 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white">
            <Asterisk className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Zeiterfassung</span>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-0.5 text-[15px]">
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

        <div className="rounded-2xl bg-surface p-4 text-sm text-ink-soft">
          <p className="flex items-center gap-2 font-medium text-ink">
            <Link2 className="h-4 w-4" /> So funktioniert’s
          </p>
          <p className="mt-1.5">
            Links für Mitarbeiter und Kunden kopierst du direkt auf dem
            A4-Blatt — pro Person über das Namens-Dropdown, für den Kunden
            über „Kunden-Link kopieren“.
          </p>
        </div>
      </aside>

      {/* ── Mobile-Header + Inhalt ───────────────────────────────── */}
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-card/90 px-4 py-3 backdrop-blur print:hidden lg:hidden">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white">
              <Asterisk className="h-4 w-4" />
            </span>
            <span className="font-semibold tracking-tight">Zeiterfassung</span>
          </Link>
        </header>
        <main className="flex-1 px-4 py-6 print:p-0 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
