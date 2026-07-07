"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { abgabe, statusAkzent, statusLabel, type SchichtView } from "@/lib/data";
import { isoHeute } from "@/lib/time";

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

function statusHintergrund(hex: string) {
  return `${hex}24`;
}

export function DashboardKalender({ schichten }: { schichten: SchichtView[] }) {
  const heute = isoHeute();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

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

      <div className="mt-3 grid grid-cols-7 gap-0.5 text-center text-[clamp(0.6rem,2vw,0.7rem)] font-medium text-ink-faint sm:gap-1">
        {WOCHENTAGE.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="mt-0.5 grid grid-cols-7 gap-0.5 sm:gap-1">
        {zellen.map((z, i) => {
          if (!z.tag || !z.iso) {
            return <span key={i} className="min-h-[5rem] sm:min-h-[6rem]" />;
          }
          const eintraege = nachDatum.get(z.iso) ?? [];
          const istHeute = z.iso === heute;

          return (
            <div
              key={z.iso}
              className={cn(
                "flex min-h-[5rem] flex-col rounded-lg border border-line/60 p-0.5 sm:min-h-[6rem] sm:p-1",
                istHeute && "ring-1 ring-ink/20"
              )}
            >
              <span className="px-0.5 text-[clamp(0.65rem,2.2vw,0.8rem)] font-semibold tabular-nums text-ink">
                {z.tag}
              </span>

              <div className="mt-0.5 flex flex-1 flex-col gap-1 overflow-hidden">
                {eintraege.map((s) => {
                  const farbe = statusAkzent[s.status];
                  const { abgegeben, gesamt } = abgabe(s.zuweisungen);
                  return (
                    <Link
                      key={s.id}
                      href={`/stundenzettel/${s.id}`}
                      className="block rounded-md border px-1 py-1 transition-opacity hover:opacity-90 sm:px-1.5 sm:py-1.5"
                      style={{
                        backgroundColor: statusHintergrund(farbe),
                        borderColor: `${farbe}55`,
                      }}
                      title={s.auftrag.titel}
                    >
                      <p
                        className="truncate text-[clamp(0.55rem,1.8vw,0.7rem)] font-semibold leading-tight"
                        style={{ color: farbe }}
                      >
                        {s.auftrag.titel}
                      </p>
                      <p className="mt-0.5 truncate text-[clamp(0.5rem,1.6vw,0.62rem)] leading-tight text-ink-soft">
                        {s.auftrag.auftraggeber}
                      </p>
                      <p className="mt-0.5 flex items-center gap-0.5 truncate text-[clamp(0.48rem,1.5vw,0.6rem)] text-ink-faint">
                        <Clock className="h-2.5 w-2.5 shrink-0" />
                        {s.beginnGeplant}–{s.endeGeplant}
                      </p>
                      <p className="mt-0.5 hidden truncate text-[clamp(0.48rem,1.5vw,0.6rem)] text-ink-soft sm:block">
                        <MapPin className="mr-0.5 inline h-2.5 w-2.5" />
                        {s.auftrag.ort}
                      </p>
                      <p className="mt-0.5 text-[clamp(0.48rem,1.5vw,0.58rem)] font-medium text-ink-soft">
                        {statusLabel[s.status]} · {abgegeben}/{gesamt}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
