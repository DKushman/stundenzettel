"use client";

import { BrandLogo } from "@/components/brand-logo";
import { SidebarHinweis, SidebarNav } from "@/components/sidebar-nav";

/** Sidebar + Hauptbereich — bleibt bei Navigation innerhalb von (shell) gemountet. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,18.5rem)_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-card px-4 py-6 print:hidden lg:flex xl:px-5">
        <div className="shrink-0">
          <BrandLogo />
        </div>

        <div className="mt-8 flex min-h-0 flex-1 flex-col overflow-hidden">
          <SidebarNav />
        </div>

        <div className="mt-4 shrink-0 pt-2">
          <SidebarHinweis />
        </div>
      </aside>

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
