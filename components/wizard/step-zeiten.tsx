"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { schrittZeitenSchema, type SchrittZeiten } from "@/lib/validations";
import { type Schicht } from "@/lib/data";
import { useAppStore, type WizardDraft } from "@/lib/store";
import { arbeitsMinuten, minutenAlsZeit } from "@/lib/time";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StepButtons } from "./step-buttons";

/** Step 2 — Zeit-Stempel: Check-in, Check-out, Pause (+ optionale Notiz). */
export function StepZeiten({
  schicht,
  draft,
  schichtId,
  onWeiter,
  onZurueck,
}: {
  schicht: Schicht;
  draft: WizardDraft;
  schichtId: string;
  onWeiter: () => void;
  onZurueck: () => void;
}) {
  const updateDraft = useAppStore((s) => s.updateDraft);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SchrittZeiten>({
    resolver: zodResolver(schrittZeitenSchema),
    defaultValues: {
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      pauseMin: draft.pauseMin,
      notiz: draft.notiz,
    },
  });

  const [checkIn, checkOut, pauseMin] = watch(["checkIn", "checkOut", "pauseMin"]);
  const minuten = checkIn && checkOut ? arbeitsMinuten(checkIn, checkOut, Number(pauseMin) || 0) : 0;
  const langerTag = minuten > 600; // Plausibilitätswarnung > 10 h

  const onSubmit = (data: SchrittZeiten) => {
    updateDraft(schichtId, {
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      pauseMin: data.pauseMin,
      notiz: data.notiz ?? "",
    });
    onWeiter();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pb-40 lg:pb-0">
      <h1 className="text-2xl font-semibold tracking-tight">Deine Zeiten</h1>
      <p className="mt-1.5 text-ink-soft">
        Geplant war {schicht.beginnGeplant}–{schicht.endeGeplant} Uhr — trage deine tatsächlichen Zeiten ein.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="checkIn">Check-in</Label>
          <Input id="checkIn" type="time" {...register("checkIn")} />
        </div>
        <div>
          <Label htmlFor="checkOut">Check-out</Label>
          <Input id="checkOut" type="time" {...register("checkOut")} />
        </div>
        <div>
          <Label htmlFor="pauseMin">Pause (Min.)</Label>
          <Input id="pauseMin" type="number" inputMode="numeric" min={0} step={5} {...register("pauseMin")} />
        </div>
      </div>
      {(errors.checkIn || errors.checkOut || errors.pauseMin) && (
        <p className="mt-2 text-sm text-red-600">
          {errors.checkOut?.message ?? errors.checkIn?.message ?? errors.pauseMin?.message}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3.5 shadow-card">
        <span className="text-[15px] text-ink-soft">Gearbeitete Zeit</span>
        <span className="text-lg font-semibold tabular-nums">{minutenAlsZeit(minuten)} h</span>
      </div>

      {langerTag && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-status-progressBg px-4 py-3 text-sm text-status-progress">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Über 10 Stunden — bitte prüfe Check-in/Check-out, bevor du fortfährst.
        </p>
      )}

      <div className="mt-5">
        <Label htmlFor="notiz">Notiz (optional)</Label>
        <Textarea id="notiz" placeholder="z. B. Materialfahrt, Wetterausfall …" {...register("notiz")} />
        {errors.notiz && <p className="mt-1.5 text-sm text-red-600">{errors.notiz.message}</p>}
      </div>

      <StepButtons onZurueck={onZurueck} />
    </form>
  );
}
