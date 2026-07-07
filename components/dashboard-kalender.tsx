"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusAkzent, statusLabel, type SchichtView } from "@/lib/data";
import { formatDatumKurz, isoHeute } from "@/lib/time";

const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function monatsLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });
}

function isoVonTag(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function DashboardKalender({ schichten }: { schichten: SchichtView[] }) {
  const heute = isoHeute();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [ausgewaehlt, setAusgewaehlt] = useState<string | null>(heute);

  const nachDatum = useMemo(() => {
    const map = new Map<string, SchichtView[]>();
    for (const s of schichten) {
      map.set(s.datum, [...(map.get(s.datum) ?? []), s]);
    }
    return map;
  }, [schichten]);

  const zellen = useMemo(() => {
    const { year, month } = cursor;
    const erster = new Date(year, month, 1);
    const startOffset = (erster.getDay() + 6) % 7; // Montag = 0
    const tageImMonat = new Date(year, month + 1, 0).getDate();
    const result: { tag: number | null; iso: string | null }[] = [];

    for (let i = 0; i < startOffset; i++) result.push({ tag: null, iso: null });
    for (let tag = 1; tag <= tageImMonat; tag++) {
      result.push({ tag, iso: isoVonTag(year, month, tag) });
    }
    while (result.length % 7 !== 0) result.push({ tag: null, iso: null });
    return result;
  }, [cursor]);

  const tagesSchichten = ausgewaehlt ? (nachDatum.get(ausgewaehlt) ?? []) : [];

  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() =>
            setCursor((c) => {
              const d = new Date(c.year, c.month - 1, 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })
          }
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-soft transition-colors hover:bg-surface hover:text-ink"
          aria-label="Vorheriger Monat"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold capitalize">{monatsLabel(cursor.year, cursor.month)}</p>
        <button
          type="button"
          onClick={() =>
            setCursor((c) => {
              const d = new Date(c.year, c.month + 1, 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })
          }
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-soft transition-colors hover:bg-surface hover:text-ink"
          aria-label="Nächster Monat"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-ink-faint">
        {WOCHENTAGE.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {zellen.map((z, i) => {
          if (!z.tag || !z.iso) {
            return <span key={i} className="aspect-square" />;
          }
          const eintraege = nachDatum.get(z.iso) ?? [];
          const istHeute = z.iso === heute;
          const aktiv = z.iso === ausgewaehlt;

          return (
            <button
              key={z.iso}
              type="button"
              onClick={() => setAusgewaehlt(z.iso)}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors",
                aktiv ? "bg-ink text-white" : "hover:bg-surface",
                istHeute && !aktiv && "ring-1 ring-ink/20"
              )}
            >
              <span className="tabular-nums">{z.tag}</span>
              {eintraege.length > 0 && (
                <span className="mt-0.5 flex max-w-full flex-wrap justify-center gap-0.5 px-0.5">
                  {eintraege.slice(0, 3).map((s) => (
                    <span
                      key={s.id}
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: aktiv ? "#fff" : statusAkzent[s.status] }}
                    />
                  ))}
                  {eintraege.length > 3 && (
                    <span className={cn("text-[9px] leading-none", aktiv ? "text-white/80" : "text-ink-faint")}>
                      +{eintraege.length - 3}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {ausgewaehlt && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-xs font-medium text-ink-soft">
            {formatDatumKurz(ausgewaehlt)}
            {tagesSchichten.length > 0 && ` · ${tagesSchichten.length} ${tagesSchichten.length === 1 ? "Eintrag" : "Einträge"}`}
          </p>
          {tagesSchichten.length === 0 ? (
            <p className="mt-2 text-sm text-ink-faint">Keine Stundenzettel an diesem Tag.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {tagesSchichten.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/stundenzettel/${s.id}`}
                    className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 transition-colors hover:bg-surface"
                  >
                    <span
                      className="h-8 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: statusAkzent[s.status] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.auftrag.titel}</p>
                      <p className="truncate text-xs text-ink-soft">{statusLabel[s.status]}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
