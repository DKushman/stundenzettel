"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Lock, CheckCircle2 } from "lucide-react";
import { getSchicht, getAuftrag, getMitarbeiter, eintragVon, type Eintrag } from "@/lib/data";
import { useAppStore, useAlleEintraege, neuerDraft } from "@/lib/store";
import { formatDatumLang } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "./progress-bar";
import { StepSchicht } from "./step-schicht";
import { StepZeiten } from "./step-zeiten";
import { StepZusammenfassung } from "./step-zusammenfassung";
import { StepSignatur } from "./step-signatur";
import { Erfolg } from "./erfolg";

export const WIZARD_STEPS = ["Schicht", "Zeiten", "Prüfen", "Signatur"] as const;

/**
 * Multi-Step-Wizard (DocuSign-Logik).
 *
 * - Progressive Disclosure: 4 Steps, jeder mit eigenem zod-Schema —
 *   ohne gültigen Step geht es nicht weiter (Gatekeeping).
 * - Alle Eingaben liegen im globalen Zustand-Store (Draft pro Schicht):
 *   Step-Wechsel, Zurück-Navigation, sogar Seitenwechsel — nichts geht verloren.
 * - Zugriffsschutz: Nur Mitarbeiter, die in der Schicht eingeteilt sind,
 *   sehen den Wizard; bereits Abgegebene werden abgefangen.
 */
export function Wizard({ schichtId }: { schichtId: string }) {
  const schicht = getSchicht(schichtId);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const draft =
    useAppStore((s) => s.drafts[schichtId]) ??
    neuerDraft(schicht?.beginnGeplant, schicht?.endeGeplant);
  const updateDraft = useAppStore((s) => s.updateDraft);
  const alleEintraege = useAlleEintraege();
  const [fertig, setFertig] = useState<Eintrag | null>(null);

  if (!schicht) {
    return <Hinweis titel="Schicht nicht gefunden" text="Dieser Link führt zu keiner bekannten Schicht." />;
  }

  const auftrag = getAuftrag(schicht.auftragId);
  const ich = getMitarbeiter(currentUserId);

  // ── Berechtigungs-Gate: nur eingeteilte Mitarbeiter ───────────────
  if (!schicht.mitarbeiterIds.includes(currentUserId)) {
    return (
      <Hinweis
        icon={<Lock className="h-6 w-6" />}
        titel="Keine Berechtigung"
        text={`${ich.vorname}, du bist in dieser Schicht (${auftrag.titel}, ${formatDatumLang(schicht.datum)}) nicht eingeteilt. Nur eingeteilte Mitarbeiter können hier einen Stundenzettel abgeben. Im Konto kannst du den Demo-Nutzer wechseln.`}
        linkHref="/konto"
        linkText="Zum Konto"
      />
    );
  }

  // ── Doppel-Abgabe-Gate ─────────────────────────────────────────────
  const vorhanden = eintragVon(schichtId, currentUserId, alleEintraege);
  if (vorhanden && !fertig) {
    return (
      <Hinweis
        icon={<CheckCircle2 className="h-6 w-6 text-status-done" />}
        titel="Bereits abgegeben"
        text={`Dein Stundenzettel für ${auftrag.titel} am ${formatDatumLang(schicht.datum)} wurde bereits eingereicht.`}
        linkHref={`/stundenzettel/${schichtId}`}
        linkText="A4-Blatt ansehen"
      />
    );
  }

  if (fertig) {
    return <Erfolg eintrag={fertig} schicht={schicht} auftrag={auftrag} />;
  }

  const step = draft.step;
  const zurueck = () => updateDraft(schichtId, { step: Math.max(0, step - 1) });
  const weiter = () => updateDraft(schichtId, { step: Math.min(3, step + 1) });

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/erfassen"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-card shadow-card transition-colors hover:bg-surface"
          aria-label="Zurück zu meinen Schichten"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight">{auftrag.titel}</p>
          <p className="truncate text-sm text-ink-soft">
            {auftrag.auftraggeber} · {formatDatumLang(schicht.datum)}
          </p>
        </div>
      </div>

      <ProgressBar steps={[...WIZARD_STEPS]} aktiv={step} />

      <div className="mt-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            {step === 0 && (
              <StepSchicht schicht={schicht} auftrag={auftrag} draft={draft} schichtId={schichtId} onWeiter={weiter} />
            )}
            {step === 1 && (
              <StepZeiten schicht={schicht} draft={draft} schichtId={schichtId} onWeiter={weiter} onZurueck={zurueck} />
            )}
            {step === 2 && (
              <StepZusammenfassung schicht={schicht} auftrag={auftrag} draft={draft} schichtId={schichtId} onWeiter={weiter} onZurueck={zurueck} />
            )}
            {step === 3 && (
              <StepSignatur schicht={schicht} draft={draft} schichtId={schichtId} onZurueck={zurueck} onFertig={setFertig} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Hinweis({
  icon,
  titel,
  text,
  linkHref,
  linkText,
}: {
  icon?: React.ReactNode;
  titel: string;
  text: string;
  linkHref?: string;
  linkText?: string;
}) {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-line bg-card p-8 text-center shadow-card">
      {icon && (
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface">
          {icon}
        </span>
      )}
      <h1 className="text-xl font-semibold">{titel}</h1>
      <p className="mt-2 text-[15px] text-ink-soft">{text}</p>
      {linkHref && (
        <Link href={linkHref} className="mt-6 inline-block">
          <Button variant="secondary">{linkText}</Button>
        </Link>
      )}
    </div>
  );
}
