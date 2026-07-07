"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { SidebarHinweis, SidebarNav } from "@/components/sidebar-nav";
import type { UnternehmenView } from "@/lib/data";

/**
 * AppShell: Sidebar + Header für die Disposition.
 * Auf den öffentlichen Token-Seiten (/erfassen, /unterschrift) wird das
 * Chrome komplett ausgeblendet — Mitarbeiter und Kunden sehen nur den
 * Inhalt ihres Links.
 */
export function AppShell({
  children,
  unternehmen,
}: {
  children: React.ReactNode;
  unternehmen: UnternehmenView[];
}) {
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
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,18.5rem)_1fr]">
      {/* ── Sidebar: sticky, volle Höhe, Notiz immer unten sichtbar ─ */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-card px-4 py-6 print:hidden lg:flex xl:px-5">
        <div className="shrink-0">
          <BrandLogo />
        </div>

        <div className="mt-8 flex min-h-0 flex-1 flex-col overflow-hidden">
          <Suspense fallback={<div className="h-10 animate-pulse rounded-xl bg-surface" />}>
            <SidebarNav unternehmen={unternehmen} />
          </Suspense>
        </div>

        <div className="mt-4 shrink-0 pt-2">
          <SidebarHinweis />
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
