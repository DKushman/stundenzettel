"use client";

import { useState } from "react";
import { BellRing, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";
import { formatDatumKurz } from "@/lib/time";
import type { SchichtView } from "@/lib/data";

type ErinnerungEintrag = {
  schicht: SchichtView;
  typ: "mitarbeiter" | "kunde";
  mitarbeiterId?: string;
  name: string;
  pfad: string;
  email?: string | null;
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0 },
};

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

export function ErinnerungenDropdown({ erinnerungen }: { erinnerungen: ErinnerungEintrag[] }) {
  const [offen, setOffen] = useState(false);

  if (erinnerungen.length === 0) return null;

  return (
    <div
      className={cn(
        "mt-5 overflow-hidden rounded-2xl border border-status-progress/30 bg-status-progressBg/60 sm:mt-6",
        offen && "border-status-progress/40 bg-status-progressBg/80"
      )}
    >
      <button
        type="button"
        onClick={() => setOffen((o) => !o)}
        aria-expanded={offen}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-status-progress/5 sm:px-5"
      >
        <BellRing className="h-4 w-4 shrink-0 text-status-progress" />
        <span className="min-w-0 flex-1">
          <span className="block text-[clamp(0.85rem,2.6vw,0.95rem)] font-semibold text-status-progress">
            {erinnerungen.length} Erinnerung{erinnerungen.length === 1 ? "" : "en"} fällig
          </span>
          <span className="mt-0.5 block text-sm text-ink-soft">Seit über 24 h ausstehend</span>
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-status-progress transition-transform duration-200",
            offen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {offen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <motion.ul
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="space-y-2 border-t border-status-progress/20 px-3 pb-3 pt-2 sm:px-4 sm:pb-4"
            >
              {erinnerungen.map((e, i) => (
                <motion.li
                  key={`${e.pfad}-${i}`}
                  variants={itemVariants}
                  className="flex flex-col gap-2 rounded-xl border border-status-progress/15 bg-card/70 px-3 py-2.5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[clamp(0.85rem,2.6vw,0.95rem)] font-medium">
                      {e.name}
                      <span className="ml-2 rounded bg-status-progress/15 px-1.5 py-0.5 text-[clamp(0.65rem,2vw,0.75rem)] font-medium text-status-progress">
                        {e.typ === "kunde" ? "Kunden-Unterschrift" : "Mitarbeiter-Erfassung"}
                      </span>
                    </p>
                    <p className="truncate text-[clamp(0.75rem,2.3vw,0.85rem)] text-ink-soft">
                      {e.schicht.auftrag.titel} · {formatDatumKurz(e.schicht.datum)}
                    </p>
                  </div>
                  <CopyButton pfad={e.pfad} label="Erinnerungs-Link kopieren" />
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
