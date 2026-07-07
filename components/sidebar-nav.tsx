"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LayoutGrid, Link2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppData } from "@/lib/app-data-store";

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const unternehmen = useAppData((s) => s.unternehmen);
  const auftragId = useAppData((s) => s.auftragId);
  const setAuftragId = useAppData((s) => s.setAuftragId);
  const aufDashboard = pathname === "/";

  const [offen, setOffen] = useState(aufDashboard);
  const [suche, setSuche] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (aufDashboard) setOffen(true);
  }, [aufDashboard]);

  const waehleAuftrag = (id: string | null) => {
    startTransition(() => {
      setAuftragId(id);
      if (!aufDashboard) router.push("/");
    });
  };

  const liste = useMemo(() => {
    const q = suche.trim().toLowerCase();
    if (!q) return unternehmen;
    return unternehmen.filter(
      (u) =>
        u.auftraggeber.toLowerCase().includes(q) ||
        u.titel.toLowerCase().includes(q) ||
        u.ort.toLowerCase().includes(q)
    );
  }, [unternehmen, suche]);

  const dashboardKlasse = cn(
    "flex w-full shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors",
    aufDashboard && !auftragId
      ? "bg-surface font-medium"
      : aufDashboard
        ? "bg-surface/60 font-medium"
        : "text-ink-soft hover:bg-surface hover:text-ink"
  );

  return (
    <nav className="flex min-h-0 flex-1 flex-col overflow-hidden text-[clamp(0.85rem,2.2vw,0.95rem)]">
      {aufDashboard ? (
        <button
          type="button"
          onClick={() => setOffen((o) => !o)}
          className={dashboardKlasse}
          aria-expanded={offen}
        >
          <LayoutGrid className="h-[18px] w-[18px] shrink-0" />
          <span className="flex-1">Dashboard</span>
          <ChevronDown
            className={cn("h-4 w-4 text-ink-faint transition-transform", offen && "rotate-180")}
          />
        </button>
      ) : (
        <Link href="/" className={dashboardKlasse} onClick={() => setOffen(true)}>
          <LayoutGrid className="h-[18px] w-[18px] shrink-0" />
          <span className="flex-1">Dashboard</span>
          <ChevronDown className="h-4 w-4 text-ink-faint" />
        </Link>
      )}

      {offen && (
        <div className="mt-1 min-h-0 flex-1 overflow-hidden">
          <div className="ml-3 flex h-full min-h-0 flex-col border-l border-line pl-3">
            <div className="relative mb-2 shrink-0">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
              <input
                value={suche}
                onChange={(e) => setSuche(e.target.value)}
                placeholder="Unternehmen suchen…"
                className="h-8 w-full rounded-lg border border-line bg-card pl-8 pr-2 text-[clamp(0.75rem,2vw,0.8rem)] placeholder:text-ink-faint focus:border-ink focus:outline-none"
              />
            </div>

            <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
              <li>
                <button
                  type="button"
                  onClick={() => waehleAuftrag(null)}
                  className={cn(
                    "block w-full rounded-lg px-2.5 py-2 text-left transition-colors",
                    aufDashboard && !auftragId
                      ? "bg-surface font-medium text-ink"
                      : "text-ink-soft hover:bg-surface hover:text-ink"
                  )}
                >
                  Alle Unternehmen
                </button>
              </li>
              {liste.map((u) => {
                const aktiv = aufDashboard && auftragId === u.id;
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => waehleAuftrag(u.id)}
                      className={cn(
                        "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                        aktiv
                          ? "bg-surface font-medium text-ink"
                          : "text-ink-soft hover:bg-surface hover:text-ink"
                      )}
                    >
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: u.farbe }}
                      />
                      <span className="min-w-0">
                        <span className="block truncate leading-tight">{u.auftraggeber}</span>
                        <span className="mt-0.5 block truncate text-[clamp(0.7rem,2vw,0.75rem)] text-ink-faint">
                          {u.titel} · {u.anzahlSchichten} Schicht
                          {u.anzahlSchichten === 1 ? "" : "en"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {unternehmen.length > 0 && liste.length === 0 && (
                <li className="px-2.5 py-3 text-[clamp(0.75rem,2vw,0.8rem)] text-ink-faint">
                  Kein Unternehmen gefunden.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
}

export function SidebarHinweis() {
  return (
    <div className="shrink-0 rounded-2xl bg-surface p-4 text-[clamp(0.8rem,2.2vw,0.875rem)] text-ink-soft">
      <p className="flex items-center gap-2 font-medium text-ink">
        <Link2 className="h-4 w-4 shrink-0" /> So funktioniert’s
      </p>
      <p className="mt-1.5">
        Links für Mitarbeiter und Kunden kopierst du direkt auf dem A4-Blatt — pro Person über das
        Namens-Dropdown, für den Kunden über „Kunden-Link kopieren“.
      </p>
    </div>
  );
}
