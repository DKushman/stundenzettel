"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** "3 von 5 abgegeben" — Fortschritt der Stundenzettel-Abgabe. */
export function AbgabeProgress({
  abgegeben,
  gesamt,
  kompakt,
}: {
  abgegeben: number;
  gesamt: number;
  kompakt?: boolean;
}) {
  const anteil = gesamt === 0 ? 0 : abgegeben / gesamt;
  const voll = abgegeben === gesamt && gesamt > 0;
  return (
    <div className={cn("min-w-0", kompakt ? "w-28" : "w-full")}>
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn("font-medium tabular-nums", kompakt ? "text-sm" : "text-[15px]")}>
          {abgegeben}<span className="text-ink-faint">/{gesamt}</span>
        </span>
        {!kompakt && (
          <span className="text-sm text-ink-soft">
            {voll ? "alle abgegeben" : `${gesamt - abgegeben} ausstehend`}
          </span>
        )}
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
        <motion.div
          className={cn("h-full rounded-full", voll ? "bg-status-done" : "bg-status-progress")}
          initial={{ width: 0 }}
          animate={{ width: `${anteil * 100}%` }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  );
}
