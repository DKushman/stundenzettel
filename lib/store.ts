"use client";

import { create } from "zustand";

/**
 * Wizard-Drafts pro Link-Token: beim Wechsel der Steps (und der Seiten)
 * geht nichts verloren. Die eigentlichen Daten liegen in Postgres.
 */

export type WizardDraft = {
  step: number;          // 0..1
  bestaetigt: boolean;
  checkIn: string;
  checkOut: string;
  pauseMin: number;
  notiz: string;
  richtigkeit: boolean;
  signatur: string;
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
  drafts: Record<string, WizardDraft>;
  updateDraft: (token: string, patch: Partial<WizardDraft>) => void;
  resetDraft: (token: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  drafts: {},
  updateDraft: (token, patch) =>
    set((s) => ({
      drafts: {
        ...s.drafts,
        [token]: { ...(s.drafts[token] ?? neuerDraft()), ...patch },
      },
    })),
  resetDraft: (token) =>
    set((s) => {
      const drafts = { ...s.drafts };
      delete drafts[token];
      return { drafts };
    }),
}));
