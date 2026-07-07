"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { schrittZusammenfassungSchema, type SchrittZusammenfassung } from "@/lib/validations";
import { type Auftrag, type Schicht, getMitarbeiter } from "@/lib/data";
import { useAppStore, type WizardDraft } from "@/lib/store";
import { arbeitsMinuten, minutenAlsZeit, formatDatumLang } from "@/lib/time";
import { StepButtons } from "./step-buttons";

/** Step 3 — Zusammenfassung: alles auf einen Blick, Richtigkeit bestätigen. */
export function StepZusammenfassung({
  schicht,
  auftrag,
  draft,
  schichtId,
  onWeiter,
  onZurueck,
}: {
  schicht: Schicht;
  auftrag: Auftrag;
  draft: WizardDraft;
  schichtId: string;
  onWeiter: () => void;
  onZurueck: () => void;
}) {
  const updateDraft = useAppStore((s) => s.updateDraft);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const ich = getMitarbeiter(currentUserId);
  const minuten = arbeitsMinuten(draft.checkIn, draft.checkOut, draft.pauseMin);

  const { register, handleSubmit, formState: { errors } } = useForm<SchrittZusammenfassung>({
    resolver: zodResolver(schrittZusammenfassungSchema),
    defaultValues: { richtigkeit: draft.richtigkeit },
  });

  const onSubmit = (data: SchrittZusammenfassung) => {
    updateDraft(schichtId, { richtigkeit: data.richtigkeit });
    onWeiter();
  };

  const zeilen: [string, string][] = [
    ["Mitarbeiter", `${ich.vorname} ${ich.nachname}`],
    ["Auftraggeber", auftrag.auftraggeber],
    ["Einsatz", `${auftrag.titel} · ${auftrag.ort}`],
    ["Datum", formatDatumLang(schicht.datum)],
    ["Check-in", `${draft.checkIn} Uhr`],
    ["Check-out", `${draft.checkOut} Uhr`],
    ["Pause", `${draft.pauseMin} min`],
    ["Gearbeitete Zeit", `${minutenAlsZeit(minuten)} h`],
  ];
  if (draft.notiz) zeilen.push(["Notiz", draft.notiz]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pb-40 lg:pb-0">
      <h1 className="text-2xl font-semibold tracking-tight">Alles korrekt?</h1>
      <p className="mt-1.5 text-ink-soft">Diese Angaben werden mit deiner Unterschrift verknüpft.</p>

      <dl className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-card">
        {zeilen.map(([label, wert]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 px-4 py-3">
            <dt className="shrink-0 text-[15px] text-ink-soft">{label}</dt>
            <dd className="text-right font-medium">{wert}</dd>
          </div>
        ))}
      </dl>

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-card p-4 shadow-card">
        <input type="checkbox" {...register("richtigkeit")} className="mt-0.5 h-5 w-5 shrink-0 rounded accent-ink" />
        <span className="text-[15px]">
          Ich bestätige die Richtigkeit dieser Angaben. Mir ist bewusst, dass sie
          zusammen mit meiner Unterschrift revisionssicher gespeichert werden.
        </span>
      </label>
      {errors.richtigkeit && <p className="mt-2 text-sm text-red-600">{errors.richtigkeit.message}</p>}

      <StepButtons onZurueck={onZurueck} weiterLabel="Zur Unterschrift" />
    </form>
  );
}
