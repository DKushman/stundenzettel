"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Clock, MapPin, Users } from "lucide-react";
import { schrittSchichtSchema, type SchrittSchicht } from "@/lib/validations";
import type { Mitarbeiter } from "@/lib/data";
import { useAppStore, type WizardDraft } from "@/lib/store";
import { formatDatumLang } from "@/lib/time";
import { AvatarStack } from "@/components/avatar";
import { StepButtons } from "./step-buttons";
import type { WizardAuftrag, WizardSchicht } from "./wizard";

/** Step 1 — Schicht/Projekt prüfen und Anwesenheit bestätigen (Gatekeeping). */
export function StepSchicht({
  schicht,
  auftrag,
  team,
  draft,
  token,
  onWeiter,
}: {
  schicht: WizardSchicht;
  auftrag: WizardAuftrag;
  team: Mitarbeiter[];
  draft: WizardDraft;
  token: string;
  onWeiter: () => void;
}) {
  const updateDraft = useAppStore((s) => s.updateDraft);

  const { register, handleSubmit, formState: { errors } } = useForm<SchrittSchicht>({
    resolver: zodResolver(schrittSchichtSchema),
    defaultValues: { bestaetigt: draft.bestaetigt },
  });

  const onSubmit = (data: SchrittSchicht) => {
    updateDraft(token, { bestaetigt: data.bestaetigt });
    onWeiter();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pb-32 lg:pb-0">
      <h1 className="text-2xl font-semibold tracking-tight">Deine Schicht</h1>
      <p className="mt-1.5 text-ink-soft">Prüfe die Angaben, bevor du deine Zeiten erfasst.</p>

      <div className="mt-6 space-y-3 rounded-2xl border border-line bg-card p-5 shadow-card">
        <InfoZeile icon={<Building2 />} label="Auftraggeber" wert={auftrag.auftraggeber} />
        <InfoZeile icon={<MapPin />} label="Einsatzort" wert={`${auftrag.titel} · ${auftrag.ort}`} />
        <InfoZeile
          icon={<Clock />}
          label="Geplante Zeit"
          wert={`${formatDatumLang(schicht.datum)}, ${schicht.beginnGeplant}–${schicht.endeGeplant} Uhr`}
        />
        <div className="flex items-center gap-3 pt-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-ink-soft">
            <Users className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink-soft">Team ({team.length} Personen)</p>
            <div className="mt-1"><AvatarStack personen={team} /></div>
          </div>
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-card p-4 shadow-card">
        <input
          type="checkbox"
          {...register("bestaetigt")}
          className="mt-0.5 h-5 w-5 shrink-0 rounded accent-ink"
        />
        <span className="text-[15px]">
          Ich bestätige, dass ich in dieser Schicht gearbeitet habe und meine
          Arbeitszeiten jetzt wahrheitsgemäß erfasse.
        </span>
      </label>
      {errors.bestaetigt && (
        <p className="mt-2 text-sm text-red-600">{errors.bestaetigt.message}</p>
      )}

      <StepButtons />
    </form>
  );
}

function InfoZeile({ icon, label, wert }: { icon: React.ReactNode; label: string; wert: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-ink-soft [&>svg]:h-[18px] [&>svg]:w-[18px]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm text-ink-soft">{label}</p>
        <p className="truncate font-medium">{wert}</p>
      </div>
    </div>
  );
}
