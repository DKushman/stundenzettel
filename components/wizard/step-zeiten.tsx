"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Clock } from "lucide-react";
import { schrittZeitenSchema, type SchrittZeiten } from "@/lib/validations";
import type { Mitarbeiter } from "@/lib/data";
import { useAppStore, type WizardDraft } from "@/lib/store";
import { arbeitsMinuten, minutenAlsZeit, formatDatumLang } from "@/lib/time";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { StepButtons } from "./step-buttons";
import type { WizardAuftrag, WizardSchicht } from "./wizard";

const PAUSE_VORSCHLAEGE = [0, 15, 30, 45, 60];

/** Schritt 1 — Begrüßung + alle Zeiten auf einer Seite (wenig Friktion). */
export function StepZeiten({
  schicht,
  auftrag,
  mitarbeiter,
  draft,
  token,
  onWeiter,
}: {
  schicht: WizardSchicht;
  auftrag: WizardAuftrag;
  mitarbeiter: Mitarbeiter;
  draft: WizardDraft;
  token: string;
  onWeiter: () => void;
}) {
  const updateDraft = useAppStore((s) => s.updateDraft);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SchrittZeiten>({
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
  const langerTag = minuten > 600;
  const pauseAktiv = Number(pauseMin) || 0;

  const onSubmit = (data: SchrittZeiten) => {
    updateDraft(token, {
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      pauseMin: data.pauseMin,
      notiz: data.notiz ?? "",
      bestaetigt: true,
    });
    onWeiter();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pb-32 lg:pb-0">
      <header className="mb-8">
        <p className="text-[clamp(1.75rem,6vw,2.25rem)] font-semibold leading-tight tracking-tight">
          Hey {mitarbeiter.vorname},
          <br />
          <span className="text-ink-soft">bitte füll den Stundenzettel aus.</span>
        </p>
        <p className="mt-3 text-[clamp(0.9rem,2.8vw,1rem)] text-ink-soft">
          {auftrag.titel} · {formatDatumLang(schicht.datum)}
        </p>
        <p className="mt-1 text-sm text-ink-faint">
          Geplant: {schicht.beginnGeplant}–{schicht.endeGeplant} Uhr — passe nur an, wenn nötig.
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-card p-4 shadow-card sm:p-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="checkIn" className="mb-1.5 block text-sm font-medium text-ink">
              Check-in
            </label>
            <Input
              id="checkIn"
              type="time"
              className="text-center text-lg font-semibold tabular-nums"
              {...register("checkIn")}
            />
          </div>
          <div>
            <label htmlFor="checkOut" className="mb-1.5 block text-sm font-medium text-ink">
              Check-out
            </label>
            <Input
              id="checkOut"
              type="time"
              className="text-center text-lg font-semibold tabular-nums"
              {...register("checkOut")}
            />
          </div>
        </div>
        {(errors.checkIn || errors.checkOut) && (
          <p className="mt-2 text-sm text-red-600">
            {errors.checkOut?.message ?? errors.checkIn?.message}
          </p>
        )}

        <div className="mt-5 border-t border-line pt-5">
          <label htmlFor="pauseMin" className="mb-2 block text-sm font-medium text-ink">
            Pause
          </label>
          <div className="mb-3 flex flex-wrap gap-2">
            {PAUSE_VORSCHLAEGE.map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => setValue("pauseMin", min, { shouldValidate: true })}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  pauseAktiv === min
                    ? "bg-ink text-card"
                    : "bg-surface text-ink-soft hover:bg-line/80 hover:text-ink"
                )}
              >
                {min === 0 ? "Keine" : `${min} min`}
              </button>
            ))}
          </div>
          <Input
            id="pauseMin"
            type="number"
            inputMode="numeric"
            min={0}
            step={5}
            placeholder="Minuten"
            className="tabular-nums"
            {...register("pauseMin")}
          />
          {errors.pauseMin && (
            <p className="mt-1.5 text-sm text-red-600">{errors.pauseMin.message}</p>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl bg-ink px-4 py-4 text-card">
          <span className="flex items-center gap-2 text-sm font-medium text-card/80">
            <Clock className="h-4 w-4" />
            Gearbeitete Zeit
          </span>
          <span className="text-[clamp(1.5rem,5vw,1.75rem)] font-bold tabular-nums">
            {minutenAlsZeit(minuten)} h
          </span>
        </div>

        {langerTag && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-status-progressBg px-3 py-2.5 text-sm text-status-progress">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Über 10 Stunden — bitte kurz prüfen.
          </p>
        )}
      </section>

      <section className="mt-5">
        <label htmlFor="notiz" className="mb-1.5 block text-sm font-medium text-ink-soft">
          Notiz <span className="font-normal text-ink-faint">(optional)</span>
        </label>
        <Textarea
          id="notiz"
          rows={3}
          placeholder="z. B. Materialfahrt, Wetter …"
          className="min-h-[88px] resize-none text-base"
          {...register("notiz")}
        />
        {errors.notiz && <p className="mt-1.5 text-sm text-red-600">{errors.notiz.message}</p>}
      </section>

      <StepButtons weiterLabel="Weiter zur Unterschrift" />
    </form>
  );
}
