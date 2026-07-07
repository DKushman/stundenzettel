"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BellRing, CalendarDays, ChevronRight, Clock, LayoutList, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { StatusLegende } from "@/components/status-legende";
import { CopyButton } from "@/components/copy-button";
import { AvatarStack } from "@/components/avatar";
import { AbgabeProgress } from "@/components/abgabe-progress";
import { DashboardKalender } from "@/components/dashboard-kalender";
import { abgabe, statusAkzent, type SchichtView } from "@/lib/data";
import { formatDatumKurz, isoHeute } from "@/lib/time";

/* ── Dashboard: Stundenzettel-Liste oder Kalender-Überblick ─────── */

type Filter = "alle" | "offen" | "erfasst" | "unterschrieben" | "geplant";
type Ansicht = "liste" | "kalender";

const filterTabs: { key: Filter; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "offen", label: "Offen" },
  { key: "erfasst", label: "Erfasst" },
  { key: "unterschrieben", label: "Unterschrieben" },
  { key: "geplant", label: "Geplant" },
];

function passtFilter(s: SchichtView, filter: Filter) {
  if (filter === "alle") return true;
  if (filter === "offen") return s.status === "offen" || s.status === "teilweise" || s.status === "ueberfaellig";
  return s.status === filter;
}

function datumImEintrag(datum: string) {
  const heute = isoHeute();
  const d = new Date(`${datum}T00:00:00`);
  const diff = Math.round((d.getTime() - new Date(`${heute}T00:00:00`).getTime()) / 86_400_000);
  const relativ =
    diff === 0 ? "Heute" : diff === -1 ? "Gestern" : diff === 1 ? "Morgen" : null;
  const kurz = formatDatumKurz(datum);
  return relativ ? `${relativ} · ${kurz}` : kurz;
}

export function Dashboard({ schichten }: { schichten: SchichtView[] }) {
  const [filter, setFilter] = useState<Filter>("alle");
  const [suche, setSuche] = useState("");
  const [ansicht, setAnsicht] = useState<Ansicht>("liste");

  const offene = schichten.filter((s) => passtFilter(s, "offen")).length;
  const erinnerungen = schichten.flatMap((s) =>
    s.faelligeErinnerungen.map((f) => ({ schicht: s, ...f }))
  );

  const liste = useMemo(() => {
    const q = suche.trim().toLowerCase();
    return schichten
      .filter((s) => {
        const namen = s.zuweisungen
          .map((z) => `${z.mitarbeiter.vorname} ${z.mitarbeiter.nachname}`)
          .join(" ");
        const text = `${s.auftrag.titel} ${s.auftrag.auftraggeber} ${s.auftrag.ort} ${s.datum} ${namen}`;
        return passtFilter(s, filter) && (!q || text.toLowerCase().includes(q));
      })
      .sort((a, b) => b.datum.localeCompare(a.datum) || a.beginnGeplant.localeCompare(b.beginnGeplant));
  }, [schichten, filter, suche]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[clamp(1.5rem,5vw,2.25rem)] font-semibold tracking-tight">Stundenzettel</h1>
          <p className="mt-1.5 text-[clamp(0.8rem,2.6vw,0.95rem)] text-ink-soft">
            {offene === 0
              ? "Alles erledigt — keine offenen Stundenzettel."
              : `${offene} ${offene === 1 ? "Stundenzettel wartet" : "Stundenzettel warten"} auf Erfassung oder Unterschrift.`}
          </p>
        </div>

        <div
          className="flex w-full shrink-0 items-center self-start rounded-xl border border-line bg-line/40 p-0.5 sm:w-auto"
          role="tablist"
          aria-label="Ansicht wechseln"
        >
          <button
            type="button"
            role="tab"
            aria-selected={ansicht === "liste"}
            onClick={() => setAnsicht("liste")}
            className={cn(
              "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-[clamp(0.75rem,2.4vw,0.875rem)] font-medium transition-colors sm:flex-none",
              ansicht === "liste" ? "bg-card text-ink shadow-card" : "text-ink-soft hover:text-ink"
            )}
          >
            <LayoutList className="h-4 w-4 shrink-0" />
            Liste
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={ansicht === "kalender"}
            onClick={() => setAnsicht("kalender")}
            className={cn(
              "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-[clamp(0.75rem,2.4vw,0.875rem)] font-medium transition-colors sm:flex-none",
              ansicht === "kalender" ? "bg-card text-ink shadow-card" : "text-ink-soft hover:text-ink"
            )}
          >
            <CalendarDays className="h-4 w-4 shrink-0" />
            Kalender
          </button>
        </div>
      </div>

      {erinnerungen.length > 0 && (
        <div className="mt-5 rounded-2xl border border-status-progress/30 bg-status-progressBg/60 p-3 sm:mt-6 sm:p-4">
          <p className="flex flex-wrap items-center gap-2 text-[clamp(0.8rem,2.5vw,0.9rem)] font-semibold text-status-progress">
            <BellRing className="h-4 w-4 shrink-0" />
            {erinnerungen.length} Erinnerung{erinnerungen.length === 1 ? "" : "en"} fällig
            <span className="font-normal text-ink-soft">— seit über 24 h ausstehend</span>
          </p>
          <ul className="mt-3 space-y-2">
            {erinnerungen.map((e, i) => (
              <li
                key={i}
                className="flex flex-col gap-2 rounded-xl bg-card px-3 py-2.5 shadow-card sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-[clamp(0.85rem,2.6vw,0.95rem)] font-medium">
                    {e.name}
                    <span className="ml-2 rounded bg-line/70 px-1.5 py-0.5 text-[clamp(0.65rem,2vw,0.75rem)] font-medium text-ink-soft">
                      {e.typ === "kunde" ? "Kunden-Unterschrift" : "Mitarbeiter-Erfassung"}
                    </span>
                  </p>
                  <p className="truncate text-[clamp(0.75rem,2.3vw,0.85rem)] text-ink-soft">
                    {e.schicht.auftrag.titel} · {formatDatumKurz(e.schicht.datum)}
                  </p>
                </div>
                <CopyButton pfad={e.pfad} label="Erinnerungs-Link kopieren" />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:mt-8">
        <div className="flex w-full max-w-full items-center gap-1 overflow-x-auto rounded-2xl bg-line/50 p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "relative whitespace-nowrap rounded-xl px-3 py-2 text-[clamp(0.8rem,2.5vw,0.95rem)] font-medium transition-colors sm:px-4",
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

        <StatusLegende />

        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint sm:left-4 sm:h-[18px] sm:w-[18px]" />
          <input
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Auftrag, Kunde oder Name suchen"
            className="h-11 w-full rounded-xl border border-line bg-card pl-10 pr-4 text-[clamp(0.85rem,2.6vw,1rem)] placeholder:text-ink-faint shadow-card focus:border-ink focus:outline-none sm:h-12 sm:pl-11"
          />
        </div>
      </div>

      {ansicht === "kalender" ? (
        <div className="mt-5 sm:mt-6">
          <DashboardKalender schichten={liste} />
        </div>
      ) : (
        <ul className="mt-5 space-y-3 sm:mt-6">
          {liste.map((s) => {
            const { abgegeben, gesamt } = abgabe(s.zuweisungen);
            const abgegebenIds = s.zuweisungen
              .filter((z) => z.eintrag)
              .map((z) => z.mitarbeiter.id);
            const akzent = statusAkzent[s.status];

            return (
              <li key={s.id}>
                <Link
                  href={`/stundenzettel/${s.id}`}
                  className="group flex flex-col gap-3 rounded-2xl border border-line bg-card p-3 shadow-card transition-colors hover:bg-surface/60 sm:p-4 lg:flex-row lg:items-stretch lg:gap-4 lg:px-5"
                >
                  <span
                    className="hidden w-1 shrink-0 rounded-full lg:block"
                    style={{ backgroundColor: akzent }}
                  />
                  <span
                    className="h-1 w-full shrink-0 rounded-full lg:hidden"
                    style={{ backgroundColor: akzent }}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-[clamp(0.65rem,2vw,0.75rem)] text-ink-faint">{datumImEintrag(s.datum)}</p>
                    <p className="mt-1 truncate text-[clamp(0.95rem,3vw,1.1rem)] font-semibold">
                      {s.auftrag.titel}
                    </p>
                    <div className="mt-1 flex flex-col gap-1 text-[clamp(0.75rem,2.3vw,0.875rem)] text-ink-soft">
                      <span className="truncate">{s.auftrag.auftraggeber}</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{s.auftrag.ort}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        {s.beginnGeplant}–{s.endeGeplant} Uhr
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:flex-wrap sm:items-center lg:border-0 lg:pt-0 lg:shrink-0">
                    <AvatarStack
                      personen={s.zuweisungen.map((z) => z.mitarbeiter)}
                      abgegebenIds={abgegebenIds}
                    />
                    <AbgabeProgress abgegeben={abgegeben} gesamt={gesamt} kompakt />
                    <div className="flex items-center justify-between gap-2 sm:justify-start">
                      <StatusBadge status={s.status} />
                      <ChevronRight className="h-5 w-5 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}

          {liste.length === 0 && (
            <li className="rounded-2xl border border-line bg-card px-4 py-12 text-center shadow-card sm:py-14">
              <p className="text-[clamp(0.9rem,2.8vw,1rem)] font-medium">Keine Stundenzettel gefunden</p>
              <p className="mt-1 text-[clamp(0.8rem,2.4vw,0.875rem)] text-ink-soft">
                Filter zurücksetzen oder Suche anpassen.
              </p>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
