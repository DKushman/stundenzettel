"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, FileText, LayoutGrid } from "lucide-react";
import { type Auftrag, type Eintrag, type Schicht } from "@/lib/data";
import { arbeitsMinuten, minutenAlsZeit, formatDatumLang } from "@/lib/time";
import { Button } from "@/components/ui/button";

/** Erfolgs-Ansicht mit Audit-Beleg — der Abschluss des DocuSign-Flows. */
export function Erfolg({ eintrag, schicht, auftrag }: { eintrag: Eintrag; schicht: Schicht; auftrag: Auftrag }) {
  const minuten = arbeitsMinuten(eintrag.checkIn, eintrag.checkOut, eintrag.pauseMin);
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

      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Stundenzettel eingereicht</h1>
      <p className="mt-2 text-ink-soft">
        {auftrag.titel} · {formatDatumLang(schicht.datum)} · {minutenAlsZeit(minuten)} h
      </p>

      {/* Audit-Beleg */}
      <dl className="mt-6 space-y-2 rounded-2xl border border-line bg-card p-4 text-left text-sm shadow-card">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-soft">Eingereicht am</dt>
          <dd className="font-medium">
            {new Date(eintrag.audit.createdAt).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })} Uhr
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-soft">Beleg-Nr.</dt>
          <dd className="font-medium">{eintrag.id.slice(0, 10)}…</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="shrink-0 text-ink-soft">Prüf-Hash</dt>
          <dd className="truncate font-mono text-xs leading-5 text-ink-soft">{eintrag.audit.dokumentHash}</dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={`/stundenzettel/${schicht.id}`} className="flex-1">
          <Button variant="secondary" className="w-full"><FileText className="h-4 w-4" /> A4-Blatt ansehen</Button>
        </Link>
        <Link href="/erfassen" className="flex-1">
          <Button className="w-full"><LayoutGrid className="h-4 w-4" /> Weitere Schichten</Button>
        </Link>
      </div>
    </div>
  );
}
