"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, Plus, Search, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { sheets, sheetMinuten, type SheetStatus } from "@/lib/data";
import { minutenAlsZeit } from "@/lib/time";

type Filter = "alle" | SheetStatus;

const filterTabs: { key: Filter; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "offen", label: "Offen" },
  { key: "eingereicht", label: "Eingereicht" },
  { key: "genehmigt", label: "Genehmigt" },
];

export function Dashboard() {
  const [filter, setFilter] = useState<Filter>("alle");
  const [suche, setSuche] = useState("");

  const offene = sheets.filter((s) => s.status === "offen").length;

  const liste = useMemo(() => {
    const q = suche.trim().toLowerCase();
    return sheets.filter((s) => {
      const passtFilter = filter === "alle" || s.status === filter;
      const namen = s.rows.map((r) => `${r.vorname} ${r.nachname}`).join(" ");
      const passtSuche =
        !q || `${s.projekt} ${s.zeitraum} ${namen}`.toLowerCase().includes(q);
      return passtFilter && passtSuche;
    });
  }, [filter, suche]);

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Titel wie im Screenshot ──────────────────────────────── */}
      <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
        Stundenzettel
      </h1>
      <p className="mt-2 text-ink-soft">
        {offene} offene Stundenzettel warten auf Einreichung
      </p>

      {/* ── Aktionskarten: dunkel + hell, wie in der Vorlage ─────── */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
        <Link
          href="/erfassen"
          className="group relative flex min-h-[150px] flex-col justify-between rounded-2xl bg-ink p-5 text-white transition-transform active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/15">
            <Plus className="h-5 w-5" />
          </span>
          <Plus className="absolute right-4 top-4 h-5 w-5 text-white/50 transition-colors group-hover:text-white" />
          <span className="mt-8 text-lg font-semibold">Zeit erfassen</span>
        </Link>

        <Link
          href={`/stundenzettel/${sheets[0]?.id ?? ""}`}
          className="group flex min-h-[150px] flex-col justify-between rounded-2xl border border-line bg-card p-5 shadow-card transition-transform active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CalendarRange className="h-5 w-5" />
          </span>
          <span className="mt-8 text-lg font-semibold">Aktuelles A4-Blatt öffnen</span>
        </Link>
      </div>

      {/* ── Filter-Pills + Suche ─────────────────────────────────── */}
      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-2xl bg-line/50 p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "relative whitespace-nowrap rounded-xl px-4 py-2 text-[15px] font-medium transition-colors",
                filter === tab.key ? "text-ink" : "text-ink-soft hover:text-ink"
              )}
            >
              {filter === tab.key && (
                <motion.span
                  layoutId="filter-pill"
                  className="absolute inset-0 rounded-xl bg-card shadow-card"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}
              <span className="relative">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="relative lg:w-80">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-faint" />
          <input
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Projekt oder Name suchen"
            className="h-12 w-full rounded-xl border border-line bg-card pl-11 pr-4 text-base placeholder:text-ink-faint shadow-card focus:border-ink focus:outline-none"
          />
        </div>
      </div>

      {/* ── Liste der A4-Blätter: Karten mobil, Tabelle ab lg ────── */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-card shadow-card">
        <div className="hidden grid-cols-[1.8fr_0.8fr_1fr_0.9fr_0.6fr] gap-4 border-b border-line px-5 py-3.5 text-sm text-ink-soft lg:grid">
          <span>Stundenzettel</span>
          <span>Einträge</span>
          <span>Zeitraum</span>
          <span>Status</span>
          <span className="text-right">Gesamt</span>
        </div>

        <ul className="divide-y divide-line">
          {liste.map((s) => (
            <li key={s.id}>
              <Link
                href={`/stundenzettel/${s.id}`}
                className="grid gap-3 px-4 py-4 transition-colors hover:bg-surface/70 lg:grid-cols-[1.8fr_0.8fr_1fr_0.9fr_0.6fr] lg:items-center lg:gap-4 lg:px-5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-card shadow-card">
                    <FileText className="h-5 w-5 text-ink-soft" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{s.projekt}</p>
                    <p className="truncate text-sm text-ink-soft lg:hidden">{s.zeitraum}</p>
                  </div>
                  <span className="ml-auto font-semibold tabular-nums lg:hidden">
                    {minutenAlsZeit(sheetMinuten(s))} h
                  </span>
                </div>

                <p className="hidden text-[15px] text-ink-soft lg:block">
                  {s.rows.length} {s.rows.length === 1 ? "Eintrag" : "Einträge"}
                </p>
                <p className="hidden truncate text-[15px] text-ink-soft lg:block">
                  {s.zeitraum}
                </p>

                <div className="flex items-center justify-between lg:justify-start">
                  <StatusBadge status={s.status} />
                  <span className="text-sm text-ink-faint lg:hidden">
                    {s.rows.length} {s.rows.length === 1 ? "Eintrag" : "Einträge"}
                  </span>
                </div>

                <span className="hidden text-right font-medium tabular-nums lg:block">
                  {minutenAlsZeit(sheetMinuten(s))} h
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {liste.length === 0 && (
          <div className="px-5 py-14 text-center">
            <p className="font-medium">Keine Stundenzettel gefunden</p>
            <p className="mt-1 text-sm text-ink-soft">
              Filter zurücksetzen oder neue Zeit erfassen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
