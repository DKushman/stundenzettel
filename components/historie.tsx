"use client";

import { useState } from "react";
import { ChevronDown, History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditView } from "@/lib/data";

const aktionLabel: Record<string, string> = {
  erstellt: "Erstellt",
  "erstellt (offline nachsynchronisiert)": "Erstellt (offline sync)",
  geaendert: "Geändert",
  kunde_unterschrieben: "Kunde hat unterschrieben",
};

const feldLabel: Record<string, string> = {
  checkIn: "Check-in",
  checkOut: "Check-out",
  pauseMin: "Pause",
  notiz: "Notiz",
};

const typTone: Record<string, string> = {
  mitarbeiter: "bg-status-openBg text-status-open",
  kunde: "bg-status-doneBg text-status-done",
  disposition: "bg-status-progressBg text-status-progress",
  system: "bg-line/60 text-ink-soft",
};

/** Änderungshistorie (Audit-Log) — wer hat wann was geändert. */
export function Historie({ eintraege }: { eintraege: AuditView[] }) {
  const [offen, setOffen] = useState(false);

  return (
    <div className="mx-auto mt-6 max-w-[210mm] overflow-hidden rounded-2xl border border-line bg-card shadow-card print:hidden">
      <button
        type="button"
        onClick={() => setOffen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-surface/60"
      >
        <span className="flex items-center gap-2.5 font-semibold">
          <History className="h-4.5 w-4.5 h-[18px] w-[18px] text-ink-soft" />
          Änderungshistorie
          <span className="rounded-md bg-line/60 px-2 py-0.5 text-sm font-medium text-ink-soft">
            {eintraege.length}
          </span>
        </span>
        <ChevronDown className={cn("h-5 w-5 text-ink-faint transition-transform", offen && "rotate-180")} />
      </button>

      {offen && (
        <div className="border-t border-line">
          {eintraege.length === 0 ? (
            <p className="px-5 py-6 text-sm text-ink-soft">Noch keine Einträge.</p>
          ) : (
            <ul className="divide-y divide-line">
              {eintraege.map((e) => (
                <li key={e.id} className="px-5 py-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-[15px] font-medium">
                      {aktionLabel[e.aktion] ?? e.aktion}
                      {e.feld && (
                        <span className="text-ink-soft"> · {feldLabel[e.feld] ?? e.feld}</span>
                      )}
                    </p>
                    <p className="text-sm tabular-nums text-ink-soft">
                      {new Date(e.erstelltAm).toLocaleString("de-DE", {
                        dateStyle: "short",
                        timeStyle: "medium",
                      })}
                    </p>
                  </div>

                  {(e.altWert !== null || e.neuWert !== null) && (
                    <p className="mt-1 text-sm">
                      <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-600 line-through decoration-red-300">
                        {e.altWert ?? "leer"}
                      </span>
                      <span className="mx-1.5 text-ink-faint">→</span>
                      <span className="rounded bg-status-doneBg px-1.5 py-0.5 text-status-done">
                        {e.neuWert ?? "leer"}
                      </span>
                    </p>
                  )}

                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-medium",
                        typTone[e.akteurTyp] ?? typTone.system
                      )}
                    >
                      {e.akteurTyp}
                    </span>
                    <span>{e.akteur}</span>
                    {e.ip && <span>· IP {e.ip}</span>}
                    {e.dokumentHash && (
                      <span className="font-mono">· Hash {e.dokumentHash.slice(0, 16)}…</span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
