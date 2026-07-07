"use client";

import { motion } from "framer-motion";
import { Check, CloudOff } from "lucide-react";
import { minutenAlsZeit } from "@/lib/time";
import type { AbgabeErgebnis } from "./step-signatur";

/** Erfolgs-Ansicht mit Audit-Beleg — der Abschluss des Questionnaires. */
export function Erfolg({
  ergebnis,
  auftragTitel,
  datumLabel,
}: {
  ergebnis: AbgabeErgebnis;
  auftragTitel: string;
  datumLabel: string;
}) {
  return (
    <div className="mx-auto max-w-md pt-6 text-center">
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-status-doneBg"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 20 }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-status-done text-white"
        >
          <Check className="h-7 w-7" strokeWidth={3} />
        </motion.span>
      </motion.span>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        {ergebnis.offline ? "Stundenzettel gespeichert" : "Stundenzettel eingereicht"}
      </h1>
      <p className="mt-2 text-ink-soft">
        {auftragTitel} · {datumLabel}
        {!ergebnis.offline && <> · {minutenAlsZeit(ergebnis.minuten)} h</>}
      </p>

      {ergebnis.offline ? (
        <p className="mt-6 flex items-start gap-2.5 rounded-2xl border border-line bg-card p-4 text-left text-sm text-ink-soft shadow-card">
          <CloudOff className="mt-0.5 h-4 w-4 shrink-0" />
          Du bist gerade offline. Deine Abgabe wurde sicher auf dem Gerät
          gespeichert und wird automatisch übertragen, sobald wieder eine
          Verbindung besteht. Du musst nichts weiter tun.
        </p>
      ) : (
        <dl className="mt-6 space-y-2 rounded-2xl border border-line bg-card p-4 text-left text-sm shadow-card">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Eingereicht am</dt>
            <dd className="font-medium">
              {new Date(ergebnis.erstelltAm).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })} Uhr
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="shrink-0 text-ink-soft">Prüf-Hash</dt>
            <dd className="truncate font-mono text-xs leading-5 text-ink-soft">
              {ergebnis.dokumentHash}
            </dd>
          </div>
        </dl>
      )}

      <p className="mt-8 text-sm text-ink-soft">Du kannst diese Seite jetzt schließen.</p>
    </div>
  );
}
