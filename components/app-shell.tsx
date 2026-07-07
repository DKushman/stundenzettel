"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Asterisk,
  Calendar,
  ChevronDown,
  Folder,
  LogOut,
  PenLine,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sheets } from "@/lib/data";

/**
 * AppShell mit animierter Sidebar:
 * Klick auf "Stundenzettel" klappt die Unterpunkte (die einzelnen
 * A4-Blätter) mit Framer Motion auf und zu — Höhe animiert,
 * Chevron rotiert, Einträge blenden gestaffelt ein.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [offen, setOffen] = useState(true);
  const gesamt = sheets.length;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[300px_1fr]">
      {/* ── Sidebar (Desktop) ─────────────────────────────────────── */}
      <aside className="hidden border-r border-line bg-card px-5 py-6 print:hidden lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-3 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white">
            <Asterisk className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Zeiterfassung</span>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-0.5 text-[15px]">
          {/* Aufklappbarer Ordner "Stundenzettel" */}
          <button
            onClick={() => setOffen((o) => !o)}
            aria-expanded={offen}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium transition-colors",
              pathname === "/" ? "bg-surface" : "hover:bg-surface"
            )}
          >
            <motion.span
              animate={{ rotate: offen ? 0 : -90 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="text-ink-faint"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.span>
            <Folder className="h-[18px] w-[18px]" />
            <span className="flex-1 text-left">Stundenzettel</span>
            <span className="text-sm text-ink-faint">{gesamt}</span>
          </button>

          <AnimatePresence initial={false}>
            {offen && (
              <motion.div
                key="unterpunkte"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <motion.div
                  className="ml-6 border-l border-line pl-2"
                  initial="zu"
                  animate="auf"
                  exit="zu"
                  variants={{
                    auf: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
                    zu: {},
                  }}
                >
                  <SidebarItem
                    href="/"
                    aktiv={pathname === "/"}
                    label="Alle Stundenzettel"
                    zahl={gesamt}
                  />
                  {sheets.map((s) => (
                    <SidebarItem
                      key={s.id}
                      href={`/stundenzettel/${s.id}`}
                      aktiv={pathname === `/stundenzettel/${s.id}`}
                      label={s.projekt}
                      zahl={s.rows.length}
                    />
                  ))}
                  <motion.button
                    variants={itemVariants}
                    className="flex items-center gap-2 px-3 py-2 text-[15px] font-medium text-blue-600 transition-colors hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4" /> Neuer Stundenzettel
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <Link
            href="/"
            className="mt-4 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-ink-soft transition-colors hover:bg-surface hover:text-ink"
          >
            <Calendar className="h-[18px] w-[18px]" /> Kalender
          </Link>
          <Link
            href="/erfassen"
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors",
              pathname === "/erfassen"
                ? "bg-surface font-medium"
                : "text-ink-soft hover:bg-surface hover:text-ink"
            )}
          >
            <PenLine className="h-[18px] w-[18px]" /> Zeit erfassen
          </Link>
        </nav>

        <button className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-ink-soft transition-colors hover:bg-surface hover:text-ink">
          <LogOut className="h-[18px] w-[18px]" /> Abmelden
        </button>
      </aside>

      {/* ── Mobile-Header + Inhalt ───────────────────────────────── */}
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-card/90 px-4 py-3 backdrop-blur print:hidden lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white">
            <Asterisk className="h-4 w-4" />
          </span>
          <span className="font-semibold tracking-tight">Zeiterfassung</span>
        </header>
        <main className="flex-1 px-4 py-6 print:p-0 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

const itemVariants = {
  auf: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  zu: { opacity: 0, x: -8, transition: { duration: 0.12 } },
};

function SidebarItem({
  href,
  aktiv,
  label,
  zahl,
}: {
  href: string;
  aktiv: boolean;
  label: string;
  zahl: number;
}) {
  return (
    <motion.div variants={itemVariants}>
      <Link
        href={href}
        className={cn(
          "flex items-center justify-between rounded-lg px-3 py-2 transition-colors",
          aktiv
            ? "bg-surface font-medium text-ink"
            : "text-ink-soft hover:bg-surface hover:text-ink"
        )}
      >
        <span className="truncate">{label}</span>
        <span className="text-sm text-ink-faint">{zahl}</span>
      </Link>
    </motion.div>
  );
}
