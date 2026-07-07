"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { Mitarbeiter } from "@/lib/data";
import { useAppStore, neuerDraft } from "@/lib/store";
import { formatDatumLang } from "@/lib/time";
import { HinweisCard } from "@/components/hinweis-card";
import { ProgressBar } from "./progress-bar";
import { StepSchicht } from "./step-schicht";
import { StepZeiten } from "./step-zeiten";
import { StepZusammenfassung } from "./step-zusammenfassung";
import { StepSignatur, type AbgabeErgebnis } from "./step-signatur";
import { Erfolg } from "./erfolg";

export const WIZARD_STEPS = ["Schicht", "Zeiten", "Prüfen", "Signatur"] as const;

export type WizardSchicht = {
  id: string;
  datum: string;
  beginnGeplant: string;
  endeGeplant: string;
};

export type WizardAuftrag = {
  titel: string;
  auftraggeber: string;
  ort: string;
};

/**
 * Mobiler Questionnaire (Multi-Step, DocuSign-Logik).
 * Zugriff ausschließlich über den signierten Link — der Token IST die
 * Berechtigung. Alle Eingaben liegen in einem Draft pro Token.
 */
export function Wizard({
  token,
  schicht,
  auftrag,
  mitarbeiter,
  team,
  bereitsAbgegeben,
}: {
  token: string;
  schicht: WizardSchicht;
  auftrag: WizardAuftrag;
  mitarbeiter: Mitarbeiter;
  team: Mitarbeiter[];
  bereitsAbgegeben: boolean;
}) {
  const draft =
    useAppStore((s) => s.drafts[token]) ??
    neuerDraft(schicht.beginnGeplant, schicht.endeGeplant);
  const updateDraft = useAppStore((s) => s.updateDraft);
  const [fertig, setFertig] = useState<AbgabeErgebnis | null>(null);

  if (bereitsAbgegeben && !fertig) {
    return (
      <HinweisCard
        icon={<CheckCircle2 className="h-6 w-6 text-status-done" />}
        titel="Bereits abgegeben"
        text={`Dein Stundenzettel für ${auftrag.titel} am ${formatDatumLang(schicht.datum)} wurde bereits eingereicht. Du kannst diese Seite schließen.`}
      />
    );
  }

  if (fertig) {
    return (
      <Erfolg
        ergebnis={fertig}
        auftragTitel={auftrag.titel}
        datumLabel={formatDatumLang(schicht.datum)}
      />
    );
  }

  const step = draft.step;
  const zurueck = () => updateDraft(token, { step: Math.max(0, step - 1) });
  const weiter = () => updateDraft(token, { step: Math.min(3, step + 1) });

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <p className="text-sm text-ink-soft">
          Hallo {mitarbeiter.vorname} — Stundenzettel für:
        </p>
        <p className="truncate font-semibold leading-tight">{auftrag.titel}</p>
        <p className="truncate text-sm text-ink-soft">
          {auftrag.auftraggeber} · {formatDatumLang(schicht.datum)}
        </p>
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
              <StepSchicht
                schicht={schicht}
                auftrag={auftrag}
                team={team}
                draft={draft}
                token={token}
                onWeiter={weiter}
              />
            )}
            {step === 1 && (
              <StepZeiten
                schicht={schicht}
                draft={draft}
                token={token}
                onWeiter={weiter}
                onZurueck={zurueck}
              />
            )}
            {step === 2 && (
              <StepZusammenfassung
                schicht={schicht}
                auftrag={auftrag}
                mitarbeiter={mitarbeiter}
                draft={draft}
                token={token}
                onWeiter={weiter}
                onZurueck={zurueck}
              />
            )}
            {step === 3 && (
              <StepSignatur
                draft={draft}
                token={token}
                onZurueck={zurueck}
                onFertig={setFertig}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
