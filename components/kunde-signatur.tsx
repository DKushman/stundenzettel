"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PenLine, ShieldCheck } from "lucide-react";
import { A4Blatt } from "@/components/a4-blatt";
import { SignatureModal } from "@/components/signature-modal";
import { PrintButton } from "@/components/print-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { kundeUnterschreiben } from "@/lib/actions";
import type { SchichtView } from "@/lib/data";
import { formatDatumKurz } from "@/lib/time";
import { abgabe } from "@/lib/data";

/** Ansicht + Gegenzeichnung für den Auftraggeber. */
export function KundeSignatur({ schicht, token }: { schicht: SchichtView; token: string }) {
  const router = useRouter();
  const [name, setName] = useState(schicht.auftrag.ansprechpartner ?? "");
  const [modalOffen, setModalOffen] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const { abgegeben, gesamt } = abgabe(schicht.zuweisungen);
  const unvollstaendig = abgegeben < gesamt;

  const unterschreiben = (signatur: string) => {
    setFehler(null);
    startTransition(async () => {
      const res = await kundeUnterschreiben({ token, name, signatur });
      if (res.ok) {
        router.refresh();
      } else {
        setFehler(res.error);
      }
    });
  };

  return (
    <div className="pb-40">
      {/* Kopfbereich */}
      <div className="mx-auto mb-6 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Stundenzettel zur Unterschrift
          </h1>
          <p className="text-sm text-ink-soft">
            {schicht.auftrag.titel} · {formatDatumKurz(schicht.datum)} ·{" "}
            {abgegeben}/{gesamt} Zeiten erfasst
          </p>
        </div>
        <PrintButton />
      </div>

      {unvollstaendig && !schicht.kunde && (
        <p className="mx-auto mb-4 max-w-[210mm] rounded-xl bg-status-progressBg px-4 py-3 text-sm text-status-progress print:hidden">
          Hinweis: Noch nicht alle Mitarbeiter haben ihre Zeiten erfasst. Sie können
          trotzdem unterschreiben — Ihre Unterschrift bezieht sich auf den aktuell
          angezeigten Stand.
        </p>
      )}

      <div className="-mx-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:px-0 print:m-0 print:overflow-visible print:p-0">
        <A4Blatt schicht={schicht} modus="kunde" onKundeUnterschreiben={() => setModalOffen(true)} />
      </div>

      {/* Aktionsleiste — daumenfreundlich am unteren Rand */}
      {!schicht.kunde ? (
        <div className="fixed inset-x-0 bottom-0 border-t border-line bg-card/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur print:hidden">
          <div className="mx-auto flex max-w-[210mm] flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <Label htmlFor="kundeName">Name der unterschreibenden Person</Label>
              <Input
                id="kundeName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Vor- und Nachname"
                autoComplete="name"
              />
            </div>
            <Button
              size="lg"
              disabled={name.trim().length < 2 || pending}
              onClick={() => setModalOffen(true)}
              className="shrink-0"
            >
              <PenLine className="h-4 w-4" />
              {pending ? "Wird gespeichert …" : "Jetzt unterschreiben"}
            </Button>
          </div>
          {fehler && (
            <p className="mx-auto mt-2 max-w-[210mm] text-sm text-red-600">{fehler}</p>
          )}
          <p className="mx-auto mt-2 flex max-w-[210mm] items-start gap-2 text-xs text-ink-soft">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Ihre Unterschrift wird mit Zeitstempel und Prüf-Hash revisionssicher
            gespeichert und fest mit den angezeigten Zeiten verknüpft.
          </p>
        </div>
      ) : (
        <p className="mx-auto mt-2 flex max-w-[210mm] items-center gap-2 rounded-xl bg-status-doneBg px-4 py-3 text-sm font-medium text-status-done print:hidden">
          <CheckCircle2 className="h-4 w-4" />
          Unterschrieben von {schicht.kunde.name} am{" "}
          {new Date(schicht.kunde.unterschriebenAm).toLocaleString("de-DE", {
            dateStyle: "short",
            timeStyle: "short",
          })}{" "}
          Uhr.
        </p>
      )}

      <SignatureModal
        open={modalOffen}
        onClose={() => setModalOffen(false)}
        onConfirm={unterschreiben}
        titel="Stundenzettel gegenzeichnen"
        hinweis={`${name || "Bitte zuerst den Namen eingeben"} — Unterschrift für ${schicht.auftrag.titel}, ${formatDatumKurz(schicht.datum)}.`}
      />
    </div>
  );
}
