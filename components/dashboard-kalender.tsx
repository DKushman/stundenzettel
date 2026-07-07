"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusLegende } from "@/components/status-legende";
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
    const startOffset = (erster.getDay() + 6) % 7;
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
    <div className="rounded-2xl border border-line bg-card p-3 shadow-card sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() =>
            setCursor((c) => {
              const d = new Date(c.year, c.month - 1, 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })
          }
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-ink-soft transition-colors hover:bg-surface hover:text-ink"
          aria-label="Vorheriger Monat"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-[clamp(0.8rem,2.8vw,0.95rem)] font-semibold capitalize">
          {monatsLabel(cursor.year, cursor.month)}
        </p>
        <button
          type="button"
          onClick={() =>
            setCursor((c) => {
              const d = new Date(c.year, c.month + 1, 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })
          }
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-ink-soft transition-colors hover:bg-surface hover:text-ink"
          aria-label="Nächster Monat"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3">
        <StatusLegende kompakt />
      </div>

      <div className="mt-3 grid grid-cols-7 gap-0.5 text-center text-[clamp(0.6rem,2vw,0.7rem)] font-medium text-ink-faint sm:gap-1">
        {WOCHENTAGE.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="mt-0.5 grid grid-cols-7 gap-0.5 sm:gap-1">
        {zellen.map((z, i) => {
          if (!z.tag || !z.iso) {
            return <span key={i} className="min-h-[4.25rem] sm:min-h-[5.5rem]" />;
          }
          const eintraege = nachDatum.get(z.iso) ?? [];
          const istHeute = z.iso === heute;
          const aktiv = z.iso === ausgewaehlt;
          const sichtbar = eintraege.slice(0, 3);
          const rest = eintraege.length - sichtbar.length;

          return (
            <button
              key={z.iso}
              type="button"
              onClick={() => setAusgewaehlt(z.iso)}
              className={cn(
                "flex min-h-[4.25rem] flex-col rounded-lg border p-0.5 text-left transition-colors sm:min-h-[5.5rem] sm:p-1",
                aktiv
                  ? "border-ink bg-ink text-white"
                  : "border-transparent hover:border-line hover:bg-surface",
                istHeute && !aktiv && "ring-1 ring-ink/25"
              )}
            >
              <span
                className={cn(
                  "px-0.5 text-[clamp(0.65rem,2.2vw,0.8rem)] font-medium tabular-nums",
                  aktiv ? "text-white" : "text-ink"
                )}
              >
                {z.tag}
              </span>

              <div className="mt-0.5 flex flex-1 flex-col gap-0.5 overflow-hidden">
                {sichtbar.map((s) => (
                  <span
                    key={s.id}
                    className={cn(
                      "flex min-h-[1.1rem] items-center gap-0.5 rounded px-0.5 sm:min-h-[1.25rem]",
                      aktiv ? "bg-white/15" : "bg-surface/80"
                    )}
                    title={`${s.auftrag.titel} · ${statusLabel[s.status]}`}
                  >
                    <span
                      className="h-full w-0.5 shrink-0 rounded-full sm:w-1"
                      style={{ backgroundColor: aktiv ? "#fff" : statusAkzent[s.status] }}
                    />
                    <span
                      className={cn(
                        "truncate text-[clamp(0.5rem,1.8vw,0.65rem)] leading-tight",
                        aktiv ? "text-white" : "text-ink-soft"
                      )}
                    >
                      {s.auftrag.titel}
                    </span>
                  </span>
                ))}
                {rest > 0 && (
                  <span
                    className={cn(
                      "px-0.5 text-[clamp(0.5rem,1.6vw,0.6rem)] leading-none",
                      aktiv ? "text-white/75" : "text-ink-faint"
                    )}
                  >
                    +{rest}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {ausgewaehlt && (
        <div className="mt-4 border-t border-line pt-4 sm:mt-5">
          <p className="text-[clamp(0.7rem,2.2vw,0.8rem)] font-medium text-ink-soft">
            {formatDatumKurz(ausgewaehlt)}
            {tagesSchichten.length > 0 &&
              ` · ${tagesSchichten.length} ${tagesSchichten.length === 1 ? "Eintrag" : "Einträge"}`}
          </p>
          {tagesSchichten.length === 0 ? (
            <p className="mt-2 text-[clamp(0.8rem,2.5vw,0.875rem)] text-ink-faint">
              Keine Stundenzettel an diesem Tag.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {tagesSchichten.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/stundenzettel/${s.id}`}
                    className="flex flex-col gap-2 rounded-xl border border-line px-3 py-2.5 transition-colors hover:bg-surface sm:flex-row sm:items-center sm:gap-3"
                  >
                    <span
                      className="h-1 w-full shrink-0 rounded-full sm:h-8 sm:w-1"
                      style={{ backgroundColor: statusAkzent[s.status] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[clamp(0.8rem,2.6vw,0.9rem)] font-medium">
                        {s.auftrag.titel}
                      </p>
                      <p className="truncate text-[clamp(0.7rem,2.2vw,0.75rem)] text-ink-soft">
                        {statusLabel[s.status]} · {s.beginnGeplant}–{s.endeGeplant}
                      </p>
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
