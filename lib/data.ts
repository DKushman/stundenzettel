/**
 * App-weite Typen und Status-Logik.
 * Die Daten selbst kommen aus Postgres (lib/queries.ts) — hier gibt es
 * keine Mock-Daten mehr.
 */

export type Mitarbeiter = {
  id: string;
  vorname: string;
  nachname: string;
  rolle: string;
  farbe: string;
  email?: string | null;
};

export type Auftrag = {
  id: string;
  titel: string;
  auftraggeber: string;
  ansprechpartner?: string | null;
  email?: string | null;
  ort: string;
  farbe: string;
};

export type EintragView = {
  id: string;
  mitarbeiterId: string;
  checkIn: string;
  checkOut: string;
  pauseMin: number;
  notiz: string | null;
  signatur: string | null;
  quelle: "mitarbeiter" | "disposition";
  dokumentHash: string | null;
  erstelltAm: string;
  geaendertAm: string | null;
};

export type ZuweisungView = {
  mitarbeiter: Mitarbeiter;
  /** Signierter Link-Token für den Questionnaire dieser Person + Schicht. */
  token: string;
  eintrag: EintragView | null;
};

export type KundeView = {
  name: string;
  signatur: string;
  unterschriebenAm: string;
  dokumentHash: string | null;
};

export type FaelligeErinnerung = {
  typ: "mitarbeiter" | "kunde";
  mitarbeiterId?: string;
  name: string;
  /** Pfad des zu verschickenden Links (relativ, ohne Origin). */
  pfad: string;
  email?: string | null;
};

export type SchichtStatus =
  | "geplant"
  | "offen"
  | "teilweise"
  | "ueberfaellig"
  | "erfasst"
  | "unterschrieben";

export type SchichtView = {
  id: string;
  datum: string;
  beginnGeplant: string;
  endeGeplant: string;
  auftrag: Auftrag;
  zuweisungen: ZuweisungView[];
  kunde: KundeView | null;
  kundenToken: string;
  status: SchichtStatus;
  faelligeErinnerungen: FaelligeErinnerung[];
};

export const statusLabel: Record<SchichtStatus, string> = {
  geplant: "Geplant",
  offen: "Heute offen",
  teilweise: "Teilweise erfasst",
  ueberfaellig: "Überfällig",
  erfasst: "Erfasst · Kunde fehlt",
  unterschrieben: "Unterschrieben",
};

export type AuditView = {
  id: string;
  entitaet: string;
  entitaetId: string;
  aktion: string;
  feld: string | null;
  altWert: string | null;
  neuWert: string | null;
  akteur: string;
  akteurTyp: string;
  userAgent: string | null;
  ip: string | null;
  dokumentHash: string | null;
  erstelltAm: string;
};

/* ── Status-Logik ──────────────────────────────────────────────────── */

export function schichtStatusBerechnen(
  datum: string,
  zuweisungen: { eintrag: EintragView | null }[],
  kunde: KundeView | null,
  heute: string
): SchichtStatus {
  if (kunde) return "unterschrieben";
  const abgegeben = zuweisungen.filter((z) => z.eintrag).length;
  const gesamt = zuweisungen.length;
  if (gesamt > 0 && abgegeben === gesamt) return "erfasst";
  if (datum > heute) return "geplant";
  if (datum < heute) return "ueberfaellig";
  return abgegeben > 0 ? "teilweise" : "offen";
}

/** Ist das geplante Schichtende + 24 h überschritten? */
export function istErinnerungFaellig(datum: string, endeGeplant: string, jetzt = Date.now()) {
  const ende = new Date(`${datum}T${endeGeplant}:00`).getTime();
  return jetzt > ende + 24 * 3_600_000;
}

export function abgabe(zuweisungen: { eintrag: EintragView | null }[]) {
  const abgegeben = zuweisungen.filter((z) => z.eintrag).length;
  return { abgegeben, gesamt: zuweisungen.length };
}
