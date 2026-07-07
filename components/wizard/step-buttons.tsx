"use client";

import { Button } from "@/components/ui/button";

/** Einheitliche Step-Navigation — sticky in der Daumenzone auf Mobil. */
export function StepButtons({
  onZurueck,
  weiterLabel = "Weiter",
  weiterDisabled,
  pending,
}: {
  onZurueck?: () => void;
  weiterLabel?: string;
  weiterDisabled?: boolean;
  pending?: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-[68px] border-t border-line bg-card/95 px-4 pb-3 pt-3 backdrop-blur lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0">
      <div className="mx-auto flex max-w-xl gap-3">
        {onZurueck && (
          <Button variant="secondary" onClick={onZurueck} className="shrink-0">
            Zurück
          </Button>
        )}
        <Button type="submit" size="lg" disabled={weiterDisabled || pending} className="flex-1">
          {pending ? "Wird gesendet …" : weiterLabel}
        </Button>
      </div>
    </div>
  );
}
