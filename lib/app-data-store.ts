"use client";

import { create } from "zustand";
import type { SchichtView, UnternehmenView } from "./data";

type FetchOpts = { force?: boolean; background?: boolean };

type AppDataState = {
  schichten: SchichtView[];
  unternehmen: UnternehmenView[];
  auftragId: string | null;
  loaded: boolean;
  loading: boolean;
  error: string | null;
  lastFetchedAt: number;
  setAuftragId: (id: string | null) => void;
  fetchDashboard: (opts?: FetchOpts) => Promise<void>;
};

let inflight: Promise<void> | null = null;

export const useAppData = create<AppDataState>((set, get) => ({
  schichten: [],
  unternehmen: [],
  auftragId: null,
  loaded: false,
  loading: false,
  error: null,
  lastFetchedAt: 0,

  setAuftragId: (id) => set({ auftragId: id }),

  fetchDashboard: async (opts = {}) => {
    const { force = false, background = false } = opts;
    const state = get();

    if (!force && state.loaded && Date.now() - state.lastFetchedAt < 60_000) return;
    if (inflight) return inflight;

    if (!background || !state.loaded) {
      set({ loading: true, error: null });
    }

    inflight = (async () => {
      try {
        const res = await fetch("/api/dashboard", { cache: "no-store" });
        if (!res.ok) throw new Error("Daten konnten nicht geladen werden.");
        const data = (await res.json()) as {
          schichten: SchichtView[];
          unternehmen: UnternehmenView[];
        };
        set({
          schichten: data.schichten,
          unternehmen: data.unternehmen,
          loaded: true,
          loading: false,
          error: null,
          lastFetchedAt: Date.now(),
        });
      } catch (e) {
        set({
          loading: false,
          error: e instanceof Error ? e.message : "Unbekannter Fehler",
        });
      } finally {
        inflight = null;
      }
    })();

    return inflight;
  },
}));
