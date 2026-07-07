"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, PenLine, ShieldCheck } from "lucide-react";
import { schrittSignaturSchema, type SchrittSignatur } from "@/lib/validations";
import { type Schicht, type Eintrag } from "@/lib/data";
import { useAppStore, type WizardDraft } from "@/lib/store";
import { submitStundenzettel } from "@/lib/actions";
import { SignatureModal } from "@/components/signature-modal";
import { StepButtons } from "./step-buttons";

/**
 * Step 4 — Signature-Flow:
 * "Unterschreiben" öffnet das Fullscreen-Modal. Erst nach "Unterschrift
 * übernehmen" ist die Signatur im Draft — und erst dann wird der
 * "Jetzt absenden"-Button freigeschaltet (Gatekeeping). Absenden ruft
 * die Server Action auf, die den Audit-Stempel + Dokument-Hash erzeugt.
 */
export function StepSignatur({
  schicht,
  draft,
  schichtId,
  onZurueck,
  onFertig,
}: {
  schicht: Schicht;
  draft: WizardDraft;
  schichtId: string;
  onZurueck: () => void;
  onFertig: (e: Eintrag) => void;
}) {
  const updateDraft = useAppStore((s) => s.updateDraft);
  const resetDraft = useAppStore((s) => s.resetDraft);
  const addEintrag = useAppStore((s) => s.addEintrag);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const [modalOffen, setModalOffen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [serverFehler, setServerFehler] = useState<string | null>(null);

  const { handleSubmit, setValue, watch, formState: { errors } } = useForm<SchrittSignatur>({
    resolver: zodResolver(schrittSignaturSchema),
    defaultValues: { signatur: draft.signatur },
  });
  const signatur = watch("signatur");

  const onSubmit = (data: SchrittSignatur) => {
    setServerFehler(null);
    startTransition(async () => {
      const result = await submitStundenzettel({
        schichtId,
        mitarbeiterId: currentUserId,
        bestaetigt: draft.bestaetigt,
        checkIn: draft.checkIn,
        checkOut: draft.checkOut,
        pauseMin: draft.pauseMin,
        notiz: draft.notiz,
        richtigkeit: draft.richtigkeit,
        signatur: data.signatur,
      });
      if (result.ok) {
        addEintrag(result.eintrag); // Demo-Spiegel der DB
        resetDraft(schichtId);      // Draft ist verbraucht
        onFertig(result.eintrag);
      } else {
        setServerFehler(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pb-40 lg:pb-0">
      <h1 className="text-2xl font-semibold tracking-tight">Unterschreiben</h1>
      <p className="mt-1.5 text-ink-soft">
        Mit deiner Unterschrift reichst du den Stundenzettel verbindlich ein.
      </p>

      <button
        type="button"
        onClick={() => setModalOffen(true)}
        className="mt-6 flex min-h-[120px] w-full items-center justify-center rounded-2xl border border-dashed border-ink-faint/60 bg-card px-4 py-4 shadow-card transition-colors hover:bg-surface"
      >
        {signatur ? (
          <span className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={signatur} alt="Deine Unterschrift" className="h-16 w-auto" />
            <CheckCircle2 className="h-5 w-5 text-status-done" />
          </span>
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-ink-soft">
            <PenLine className="h-6 w-6" />
            <span className="font-medium text-ink">Unterschreiben</span>
            <span className="text-sm">Öffnet das Unterschriftenfeld</span>
          </span>
        )}
      </button>
      {signatur && (
        <button
          type="button"
          onClick={() => { setValue("signatur", "", { shouldValidate: false }); updateDraft(schichtId, { signatur: "" }); }}
          className="mt-2 text-sm text-ink-soft underline-offset-2 hover:underline"
        >
          Unterschrift verwerfen und neu unterschreiben
        </button>
      )}
      {errors.signatur && <p className="mt-2 text-sm text-red-600">{errors.signatur.message}</p>}

      <p className="mt-5 flex items-start gap-2.5 rounded-xl bg-surface px-4 py-3 text-sm text-ink-soft">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        Beim Absenden erzeugt der Server einen Audit-Stempel (Zeitpunkt, Session,
        Gerät) und einen Prüf-Hash, der deine Unterschrift fest mit den Angaben verknüpft.
      </p>

      {serverFehler && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{serverFehler}</p>
      )}

      <StepButtons
        onZurueck={onZurueck}
        weiterLabel="Jetzt absenden"
        weiterDisabled={!signatur}
        pending={pending}
      />

      <SignatureModal
        open={modalOffen}
        onClose={() => setModalOffen(false)}
        onConfirm={(dataUrl) => {
          setValue("signatur", dataUrl, { shouldValidate: true });
          updateDraft(schichtId, { signatur: dataUrl });
        }}
      />
    </form>
  );
}
