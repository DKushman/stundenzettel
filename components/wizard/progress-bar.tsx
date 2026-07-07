"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Klare Progress-Bar über dem Wizard: Kreise + animierte Fülllinie. */
export function ProgressBar({ steps, aktiv }: { steps: string[]; aktiv: number }) {
  return (
    <div>
      <div className="relative flex items-center justify-between">
        {/* Grundlinie + animierter Fortschritt */}
        <div className="absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 bg-line" />
        <motion.div
          className="absolute left-4 top-1/2 h-0.5 -translate-y-1/2 bg-ink"
          initial={false}
          animate={{ width: `calc(${(aktiv / (steps.length - 1)) * 100}% - ${(aktiv / (steps.length - 1)) * 32}px)` }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        />
        {steps.map((label, i) => {
          const erledigt = i < aktiv;
          const istAktiv = i === aktiv;
          return (
            <span
              key={label}
              className={cn(
                "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                erledigt && "border-ink bg-ink text-white",
                istAktiv && "border-ink bg-card text-ink",
                !erledigt && !istAktiv && "border-line bg-card text-ink-faint"
              )}
            >
              {erledigt ? <Check className="h-4 w-4" /> : i + 1}
            </span>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between">
        {steps.map((label, i) => (
          <span
            key={label}
            className={cn(
              "w-16 text-center text-xs first:text-left last:text-right",
              i === aktiv ? "font-semibold text-ink" : "text-ink-faint"
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
