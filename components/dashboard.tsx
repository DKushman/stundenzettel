"use client";

import { memo, useDeferredValue, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, ChevronRight, Clock, LayoutList, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { AvatarStack } from "@/components/avatar";
import { AbgabeProgress } from "@/components/abgabe-progress";
import { DashboardKalender } from "@/components/dashboard-kalender";
import { ErinnerungenDropdown } from "@/components/erinnerungen-dropdown";
import { useAppData } from "@/lib/app-data-store";
import { abgabe, statusAkzent, type SchichtStatus, type SchichtView } from "@/lib/data";
import { formatDatumKurz, isoHeute } from "@/lib/time";

type Filter = "alle" | SchichtStatus;
type Ansicht = "liste" | "kalender";

const filterTabs: { key: Filter; label: string; farbe?: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "geplant", label: "Geplant", farbe: statusAkzent.geplant },
  { key: "offen", label: "Offen", farbe: statusAkzent.offen },
  { key: "teilweise", label: "Teilweise", farbe: statusAkzent.teilweise },
  { key: "ueberfaellig", label: "Überfällig", farbe: statusAkzent.ueberfaellig },
  { key: "erfasst", label: "Erfasst", farbe: statusAkzent.erfasst },
  { key: "unterschrieben", label: "Unterschrieben", farbe: statusAkzent.unterschrieben },
];

function passtFilter(s: SchichtView, filter: Filter) {
  if (filter === "alle") return true;
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

function suchText(s: SchichtView) {
  const namen = s.zuweisungen
    .map((z) => `${z.mitarbeiter.vorname} ${z.mitarbeiter.nachname}`)
    .join(" ");
  return `${s.auftrag.titel} ${s.auftrag.auftraggeber} ${s.auftrag.ort} ${s.datum} ${namen}`.toLowerCase();
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};

const SchichtZeile = memo(function SchichtZeile({ s }: { s: SchichtView }) {
  const { abgegeben, gesamt } = abgabe(s.zuweisungen);
  const abgegebenIds = s.zuweisungen.filter((z) => z.eintrag).map((z) => z.mitarbeiter.id);
  const akzent = statusAkzent[s.status];

  return (
    <motion.li variants={itemVariants} layout="position">
      <Link
        href={`/stundenzettel/${s.id}`}
        prefetch
        className="group flex flex-col gap-3 rounded-2xl border border-line bg-card p-3 shadow-card transition-colors hover:bg-surface/60 sm:p-4 lg:flex-row lg:items-stretch lg:gap-4 lg:px-5"
      >
        <span className="hidden w-1 shrink-0 rounded-full lg:block" style={{ backgroundColor: akzent }} />
        <span className="h-1 w-full shrink-0 rounded-full lg:hidden" style={{ backgroundColor: akzent }} />

        <div className="min-w-0 flex-1">
          <p className="text-[clamp(0.65rem,2vw,0.75rem)] text-ink-faint">{datumImEintrag(s.datum)}</p>
          <p className="mt-1 truncate text-[clamp(0.95rem,3vw,1.1rem)] font-semibold">{s.auftrag.titel}</p>
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
          <AvatarStack personen={s.zuweisungen.map((z) => z.mitarbeiter)} abgegebenIds={abgegebenIds} />
          <AbgabeProgress abgegeben={abgegeben} gesamt={gesamt} kompakt />
          <div className="flex items-center justify-between gap-2 sm:justify-start">
            <StatusBadge status={s.status} />
            <ChevronRight className="h-5 w-5 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </Link>
    </motion.li>
  );
});

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse">
      <div className="h-9 w-48 rounded-lg bg-line/70" />
      <div className="mt-3 h-5 w-72 max-w-full rounded bg-line/50" />
      <div className="mt-8 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-20 rounded-xl bg-line/60" />
        ))}
      </div>
      <div className="mt-3 h-12 w-full rounded-xl bg-line/50" />
      <ul className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="h-28 rounded-2xl bg-line/40" />
        ))}
      </ul>
    </div>
  );
}

export function Dashboard() {
  const schichten = useAppData((s) => s.schichten);
  const auftragFilter = useAppData((s) => s.auftragId);
  const loading = useAppData((s) => s.loading);
  const loaded = useAppData((s) => s.loaded);
  const error = useAppData((s) => s.error);
  const fetchDashboard = useAppData((s) => s.fetchDashboard);

  const [filter, setFilter] = useState<Filter>("alle");
  const [suche, setSuche] = useState("");
  const [ansicht, setAnsicht] = useState<Ansicht>("liste");
  const [, startTransition] = useTransition();
  const deferredSuche = useDeferredValue(suche.trim().toLowerCase());

  const index = useMemo(
    () => schichten.map((s) => ({ s, text: suchText(s) })),
    [schichten]
  );

  const offene = useMemo(
    () =>
      schichten.filter(
        (s) => s.status === "offen" || s.status === "teilweise" || s.status === "ueberfaellig"
      ).length,
    [schichten]
  );

  const erinnerungen = useMemo(
    () => schichten.flatMap((s) => s.faelligeErinnerungen.map((f) => ({ schicht: s, ...f }))),
    [schichten]
  );

  const liste = useMemo(() => {
    return index
      .filter(({ s, text }) => {
        if (auftragFilter && s.auftrag.id !== auftragFilter) return false;
        return passtFilter(s, filter) && (!deferredSuche || text.includes(deferredSuche));
      })
      .map(({ s }) => s)
      .sort((a, b) => b.datum.localeCompare(a.datum) || a.beginnGeplant.localeCompare(b.beginnGeplant));
  }, [index, filter, deferredSuche, auftragFilter]);

  if (!loaded && loading) return <DashboardSkeleton />;

  if (error && !loaded) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-line bg-card p-6 text-center shadow-card">
        <p className="font-medium">{error}</p>
        <button
          type="button"
          onClick={() => fetchDashboard({ force: true })}
          className="mt-4 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-card"
        >
          Erneut laden
        </button>
      </div>
    );
  }

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

      <ErinnerungenDropdown erinnerungen={erinnerungen} />

      <div className="mt-6 flex flex-col gap-3 sm:mt-8">
        <div className="w-fit max-w-full overflow-x-auto rounded-2xl bg-line/50 p-1">
          <div className="flex w-fit items-center gap-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => startTransition(() => setFilter(tab.key))}
                className={cn(
                  "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-[clamp(0.75rem,2.3vw,0.875rem)] font-medium transition-colors sm:px-3.5",
                  filter === tab.key ? "text-ink" : "text-ink-soft hover:text-ink"
                )}
              >
                {filter === tab.key && (
                  <span className="absolute inset-0 rounded-xl bg-card shadow-card" />
                )}
                {tab.farbe ? (
                  <span
                    className="relative h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: tab.farbe }}
                  />
                ) : (
                  <span className="relative h-2 w-2 shrink-0 rounded-full bg-ink-faint" />
                )}
                <span className="relative">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

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
        <motion.ul
          key={`${filter}-${auftragFilter ?? "alle"}-${deferredSuche}`}
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="mt-5 space-y-3 sm:mt-6"
        >
          {liste.map((s) => (
            <SchichtZeile key={s.id} s={s} />
          ))}

          {liste.length === 0 && (
            <motion.li
              variants={itemVariants}
              className="rounded-2xl border border-line bg-card px-4 py-12 text-center shadow-card sm:py-14"
            >
              <p className="text-[clamp(0.9rem,2.8vw,1rem)] font-medium">Keine Stundenzettel gefunden</p>
              <p className="mt-1 text-[clamp(0.8rem,2.4vw,0.875rem)] text-ink-soft">
                Filter zurücksetzen oder Suche anpassen.
              </p>
            </motion.li>
          )}
        </motion.ul>
      )}
    </div>
  );
}
