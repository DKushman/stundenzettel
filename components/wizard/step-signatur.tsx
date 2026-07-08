"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, PenLine } from "lucide-react";
import { schrittSignaturSchema, type SchrittSignatur } from "@/lib/validations";
import { useAppStore, type WizardDraft } from "@/lib/store";
import { submitEintrag, type SubmitErgebnis } from "@/lib/offline";
import { arbeitsMinuten, minutenAlsZeit, formatDatumLang } from "@/lib/time";
import { SignatureModal } from "@/components/signature-modal";
import { StepButtons } from "./step-buttons";
import type { WizardAuftrag, WizardSchicht } from "./wizard";

export type AbgabeErgebnis = Extract<SubmitErgebnis, { ok: true }>;

/** Schritt 2 — Kurze Übersicht + Unterschrift + Absenden. */
export function StepSignatur({
  schicht,
  auftrag,
  draft,
  token,
  onZurueck,
  onFertig,
}: {
  schicht: WizardSchicht;
  auftrag: WizardAuftrag;
  draft: WizardDraft;
  token: string;
  onZurueck: () => void;
  onFertig: (e: AbgabeErgebnis) => void;
}) {
  const updateDraft = useAppStore((s) => s.updateDraft);
  const resetDraft = useAppStore((s) => s.resetDraft);
  const [modalOffen, setModalOffen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [serverFehler, setServerFehler] = useState<string | null>(null);
  const minuten = arbeitsMinuten(draft.checkIn, draft.checkOut, draft.pauseMin);

  const { handleSubmit, setValue, watch, formState: { errors } } = useForm<SchrittSignatur>({
    resolver: zodResolver(schrittSignaturSchema),
    defaultValues: { signatur: draft.signatur },
  });
  const signatur = watch("signatur");

  const onSubmit = (data: SchrittSignatur) => {
    setServerFehler(null);
    startTransition(async () => {
      const result = await submitEintrag({
        token,
        checkIn: draft.checkIn,
        checkOut: draft.checkOut,
        pauseMin: draft.pauseMin,
        notiz: draft.notiz,
        signatur: data.signatur,
        bestaetigt: true,
        richtigkeit: true,
      });
      if (result.ok) {
        resetDraft(token);
        onFertig(result);
      } else {
        setServerFehler(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pb-32 lg:pb-0">
      <h1 className="text-[clamp(1.5rem,5vw,2rem)] font-semibold tracking-tight">
        Passt alles?
      </h1>
      <p className="mt-1.5 text-ink-soft">Unterschreibe unten — dann ist der Stundenzettel fertig.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-card shadow-card">
        <div className="border-b border-line bg-surface/60 px-4 py-3">
          <p className="font-medium">{auftrag.titel}</p>
          <p className="text-sm text-ink-soft">{formatDatumLang(schicht.datum)}</p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-line text-center">
          <div className="px-3 py-4">
            <p className="text-xs text-ink-faint">Check-in</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{draft.checkIn}</p>
          </div>
          <div className="px-3 py-4">
            <p className="text-xs text-ink-faint">Check-out</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{draft.checkOut}</p>
          </div>
          <div className="bg-ink px-3 py-4 text-card">
            <p className="text-xs text-card/70">Gearbeitet</p>
            <p className="mt-1 text-lg font-bold tabular-nums">{minutenAlsZeit(minuten)} h</p>
          </div>
        </div>
        {draft.pauseMin > 0 && (
          <p className="border-t border-line px-4 py-2 text-center text-sm text-ink-soft">
            Pause: {draft.pauseMin} min
          </p>
        )}
        {draft.notiz && (
          <p className="border-t border-line px-4 py-3 text-sm text-ink-soft">
            <span className="font-medium text-ink">Notiz:</span> {draft.notiz}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setModalOffen(true)}
        className="mt-6 flex min-h-[130px] w-full items-center justify-center rounded-2xl border-2 border-dashed border-ink/20 bg-card px-4 py-4 shadow-card transition-colors hover:border-ink/40 hover:bg-surface"
      >
        {signatur ? (
          <span className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={signatur} alt="Deine Unterschrift" className="h-16 w-auto" />
            <CheckCircle2 className="h-5 w-5 text-status-done" />
          </span>
        ) : (
          <span className="flex flex-col items-center gap-2 text-ink-soft">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface">
              <PenLine className="h-6 w-6 text-ink" />
            </span>
            <span className="font-semibold text-ink">Hier unterschreiben</span>
          </span>
        )}
      </button>
      {signatur && (
        <button
          type="button"
          onClick={() => {
            setValue("signatur", "", { shouldValidate: false });
            updateDraft(token, { signatur: "" });
          }}
          className="mt-2 text-sm text-ink-soft underline-offset-2 hover:underline"
        >
          Neu unterschreiben
        </button>
      )}
      {errors.signatur && <p className="mt-2 text-sm text-red-600">{errors.signatur.message}</p>}

      {serverFehler && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{serverFehler}</p>
      )}

      <StepButtons
        onZurueck={onZurueck}
        weiterLabel="Stundenzettel absenden"
        weiterDisabled={!signatur}
        pending={pending}
      />

      <SignatureModal
        open={modalOffen}
        onClose={() => setModalOffen(false)}
        onConfirm={(dataUrl) => {
          setValue("signatur", dataUrl, { shouldValidate: true });
          updateDraft(token, { signatur: dataUrl });
        }}
      />
    </form>
  );
}
