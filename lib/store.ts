"use client";

import { create } from "zustand";
import { eintraege as statischeEintraege, type Eintrag } from "./data";

/* ────────────────────────────────────────────────────────────────────
 * Globaler App-State (Zustand)
 *
 * 1) Demo-Login: currentUserId — damit lässt sich die Berechtigungs-
 *    logik testen (nur eingeteilte Mitarbeiter dürfen abgeben).
 * 2) Wizard-Drafts pro Schicht: beim Wechsel der Steps (und sogar der
 *    Seiten) geht nichts verloren.
 * 3) Lokale Einträge: erfolgreich abgeschickte Stundenzettel — bis die
 *    echte DB angebunden ist, spiegelt der Store die Datenbank.
 *    (Für Persistenz über Reloads: zustand/middleware `persist`.)
 * ──────────────────────────────────────────────────────────────────── */

export type WizardDraft = {
  step: number;          // 0..3
  bestaetigt: boolean;   // Step 1: Anwesenheit bestätigt
  checkIn: string;
  checkOut: string;
  pauseMin: number;
  notiz: string;
  richtigkeit: boolean;  // Step 3: Angaben korrekt
  signatur: string;      // Step 4: PNG-Data-URL
};

export const neuerDraft = (checkIn = "07:00", checkOut = "16:00"): WizardDraft => ({
  step: 0,
  bestaetigt: false,
  checkIn,
  checkOut,
  pauseMin: 30,
  notiz: "",
  richtigkeit: false,
  signatur: "",
});

type AppState = {
  currentUserId: string;
  setCurrentUser: (id: string) => void;

  drafts: Record<string, WizardDraft>;
  updateDraft: (schichtId: string, patch: Partial<WizardDraft>) => void;
  resetDraft: (schichtId: string) => void;

  lokaleEintraege: Eintrag[];
  addEintrag: (e: Eintrag) => void;
};

export const useAppStore = create<AppState>((set) => ({
  currentUserId: "m1",
  setCurrentUser: (id) => set({ currentUserId: id }),

  drafts: {},
  updateDraft: (schichtId, patch) =>
    set((s) => ({
      drafts: {
        ...s.drafts,
        [schichtId]: { ...(s.drafts[schichtId] ?? neuerDraft()), ...patch },
      },
    })),
  resetDraft: (schichtId) =>
    set((s) => {
      const drafts = { ...s.drafts };
      delete drafts[schichtId];
      return { drafts };
    }),

  lokaleEintraege: [],
  addEintrag: (e) => set((s) => ({ lokaleEintraege: [...s.lokaleEintraege, e] })),
}));

/** Statische Demo-Einträge + in dieser Session abgegebene — die "DB-Sicht". */
export function useAlleEintraege(): Eintrag[] {
  const lokale = useAppStore((s) => s.lokaleEintraege);
  return [...statischeEintraege, ...lokale];
}
