"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BellRing, ChevronRight, Clock, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { CopyButton } from "@/components/copy-button";
import { AvatarStack } from "@/components/avatar";
import { AbgabeProgress } from "@/components/abgabe-progress";
import { abgabe, type SchichtView } from "@/lib/data";
import { formatDatumKurz, isoHeute } from "@/lib/time";

/* ── Dashboard: Stundenzettel nach Datum geordnet ─────────────────── */

type Filter = "alle" | "offen" | "erfasst" | "unterschrieben" | "geplant";

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

function datumUeberschrift(datum: string) {
  const heute = isoHeute();
  const d = new Date(`${datum}T00:00:00`);
  const wochentag = d.toLocaleDateString("de-DE", { weekday: "long" });
  const lang = d.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
  const diff = Math.round((d.getTime() - new Date(`${heute}T00:00:00`).getTime()) / 86_400_000);
  const relativ =
    diff === 0 ? "Heute" : diff === -1 ? "Gestern" : diff === 1 ? "Morgen" : wochentag;
  return `${relativ}, ${lang}`;
}

export function Dashboard({ schichten }: { schichten: SchichtView[] }) {
  const [filter, setFilter] = useState<Filter>("alle");
  const [suche, setSuche] = useState("");

  const offene = schichten.filter((s) => passtFilter(s, "offen")).length;
  const erinnerungen = schichten.flatMap((s) =>
    s.faelligeErinnerungen.map((f) => ({ schicht: s, ...f }))
  );

  const liste = useMemo(() => {
    const q = suche.trim().toLowerCase();
    return schichten.filter((s) => {
      const namen = s.zuweisungen
        .map((z) => `${z.mitarbeiter.vorname} ${z.mitarbeiter.nachname}`)
        .join(" ");
      const text = `${s.auftrag.titel} ${s.auftrag.auftraggeber} ${s.auftrag.ort} ${s.datum} ${namen}`;
      return passtFilter(s, filter) && (!q || text.toLowerCase().includes(q));
    });
  }, [schichten, filter, suche]);

  // Nach Datum gruppieren (neueste zuerst — Reihenfolge kommt sortiert vom Server)
  const gruppen = useMemo(() => {
    const map = new Map<string, SchichtView[]>();
    for (const s of liste) {
      map.set(s.datum, [...(map.get(s.datum) ?? []), s]);
    }
    return [...map.entries()];
  }, [liste]);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">Stundenzettel</h1>
      <p className="mt-2 text-ink-soft">
        {offene === 0
          ? "Alles erledigt — keine offenen Stundenzettel."
          : `${offene} ${offene === 1 ? "Stundenzettel wartet" : "Stundenzettel warten"} auf Erfassung oder Unterschrift.`}
      </p>

      {/* ── Fällige Erinnerungen (>24 h nach Schichtende) ───────────── */}
      {erinnerungen.length > 0 && (
        <div className="mt-6 rounded-2xl border border-status-progress/30 bg-status-progressBg/60 p-4">
          <p className="flex items-center gap-2 font-semibold text-status-progress">
            <BellRing className="h-4 w-4" />
            {erinnerungen.length} Erinnerung{erinnerungen.length === 1 ? "" : "en"} fällig
            <span className="font-normal text-ink-soft">— seit über 24 h ausstehend</span>
          </p>
          <ul className="mt-3 space-y-2">
            {erinnerungen.map((e, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card px-3.5 py-2.5 shadow-card"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium">
                    {e.name}
                    <span className="ml-2 rounded bg-line/70 px-1.5 py-0.5 text-xs font-medium text-ink-soft">
                      {e.typ === "kunde" ? "Kunden-Unterschrift" : "Mitarbeiter-Erfassung"}
                    </span>
                  </p>
                  <p className="truncate text-sm text-ink-soft">
                    {e.schicht.auftrag.titel} · {formatDatumKurz(e.schicht.datum)}
                  </p>
                </div>
                <CopyButton pfad={e.pfad} label="Erinnerungs-Link kopieren" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Filter + Suche ──────────────────────────────────────────── */}
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
            placeholder="Auftrag, Kunde oder Name suchen"
            className="h-12 w-full rounded-xl border border-line bg-card pl-11 pr-4 text-base placeholder:text-ink-faint shadow-card focus:border-ink focus:outline-none"
          />
        </div>
      </div>

      {/* ── Nach Datum gruppierte Liste ─────────────────────────────── */}
      <div className="mt-6 space-y-8">
        {gruppen.map(([datum, tagesSchichten]) => (
          <section key={datum}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
              {datumUeberschrift(datum)}
            </h2>
            <ul className="space-y-3">
              {tagesSchichten.map((s) => {
                const { abgegeben, gesamt } = abgabe(s.zuweisungen);
                const abgegebenIds = s.zuweisungen
                  .filter((z) => z.eintrag)
                  .map((z) => z.mitarbeiter.id);
                return (
                  <li key={s.id}>
                    <Link
                      href={`/stundenzettel/${s.id}`}
                      className="group flex flex-col gap-3 rounded-2xl border border-line bg-card p-4 shadow-card transition-colors hover:bg-surface/60 lg:flex-row lg:items-center lg:gap-5 lg:px-5"
                    >
                      <span
                        className="hidden h-11 w-1.5 shrink-0 rounded-full lg:block"
                        style={{ backgroundColor: s.auftrag.farbe }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full lg:hidden"
                            style={{ backgroundColor: s.auftrag.farbe }}
                          />
                          <p className="truncate font-semibold">{s.auftrag.titel}</p>
                        </div>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-ink-soft">
                          <span className="truncate">{s.auftrag.auftraggeber}</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {s.auftrag.ort}
                          </span>
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Clock className="h-3.5 w-3.5" /> {s.beginnGeplant}–{s.endeGeplant} Uhr
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-4 lg:shrink-0">
                        <AvatarStack
                          personen={s.zuweisungen.map((z) => z.mitarbeiter)}
                          abgegebenIds={abgegebenIds}
                        />
                        <AbgabeProgress abgegeben={abgegeben} gesamt={gesamt} kompakt />
                        <StatusBadge status={s.status} />
                        <ChevronRight className="hidden h-5 w-5 text-ink-faint transition-transform group-hover:translate-x-0.5 lg:block" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {liste.length === 0 && (
          <div className="rounded-2xl border border-line bg-card px-5 py-14 text-center shadow-card">
            <p className="font-medium">Keine Stundenzettel gefunden</p>
            <p className="mt-1 text-sm text-ink-soft">Filter zurücksetzen oder Suche anpassen.</p>
          </div>
        )}
      </div>
    </div>
  );
}
