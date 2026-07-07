import { arbeitsMinuten, isoHeute, tagOffset } from "./time";

/* ────────────────────────────────────────────────────────────────────
 * Datenmodell — entspricht den späteren Postgres-Tabellen.
 * ──────────────────────────────────────────────────────────────────── */

export type Mitarbeiter = {
  id: string;
  vorname: string;
  nachname: string;
  rolle: "Mitarbeiter" | "Bauleitung";
  farbe: string; // Avatar-Farbe
};

export type Auftrag = {
  id: string;
  titel: string;
  auftraggeber: string; // wer den Auftrag erteilt hat
  ort: string;
  farbe: string;        // Kalender-/Chip-Farbe
};

export type Schicht = {
  id: string;
  auftragId: string;
  datum: string;          // ISO
  beginnGeplant: string;  // "07:00"
  endeGeplant: string;
  mitarbeiterIds: string[]; // nur diese dürfen Stundenzettel abgeben
};

export type Audit = {
  createdAt: string;      // Server-Zeitstempel
  sessionId: string;
  userAgent: string;
  dokumentHash: string;   // SHA-256 über Felder + Signatur
};

/** Eine abgegebene Stundenzettel-Zeile — Felder + Signatur = EIN Datensatz. */
export type Eintrag = {
  id: string;
  schichtId: string;
  mitarbeiterId: string;
  checkIn: string;
  checkOut: string;
  pauseMin: number;
  notiz?: string;
  signatur: string;       // PNG-Data-URL aus dem Modal
  audit: Audit;
};

/* ── Demo-Daten (werden durch Postgres ersetzt) ──────────────────── */

export const mitarbeiter: Mitarbeiter[] = [
  { id: "m1", vorname: "David", nachname: "Chiosea", rolle: "Mitarbeiter", farbe: "#3B82F6" },
  { id: "m2", vorname: "Anna", nachname: "Fischer", rolle: "Mitarbeiter", farbe: "#8B5CF6" },
  { id: "m3", vorname: "Heinrich", nachname: "Vogel", rolle: "Mitarbeiter", farbe: "#F59E0B" },
  { id: "m4", vorname: "Sabine", nachname: "Weber", rolle: "Bauleitung", farbe: "#EC4899" },
  { id: "m5", vorname: "Klaus", nachname: "Berger", rolle: "Mitarbeiter", farbe: "#10B981" },
  { id: "m6", vorname: "Renate", nachname: "Scholz", rolle: "Mitarbeiter", farbe: "#6366F1" },
];

export const auftraege: Auftrag[] = [
  { id: "a1", titel: "Rohbau Halle B", auftraggeber: "Immobilien AG Nord", ort: "Bauprojekt Nordstadt", farbe: "#3B82F6" },
  { id: "a2", titel: "Fassadensanierung", auftraggeber: "Weber Bau GmbH", ort: "Sanierung Weststraße", farbe: "#E28412" },
  { id: "a3", titel: "Innenausbau Kita", auftraggeber: "Stadt — Amt für Gebäude", ort: "Neubau Kita Sonnenhof", farbe: "#1CA97A" },
];

export const schichten: Schicht[] = [
  { id: "s1", auftragId: "a1", datum: isoHeute(), beginnGeplant: "07:00", endeGeplant: "16:00", mitarbeiterIds: ["m1", "m2", "m3", "m4"] },
  { id: "s2", auftragId: "a2", datum: isoHeute(), beginnGeplant: "08:00", endeGeplant: "17:00", mitarbeiterIds: ["m5", "m6"] },
  { id: "s3", auftragId: "a3", datum: tagOffset(-1), beginnGeplant: "07:30", endeGeplant: "15:30", mitarbeiterIds: ["m1", "m5", "m6"] },
  { id: "s4", auftragId: "a1", datum: tagOffset(-3), beginnGeplant: "07:00", endeGeplant: "16:00", mitarbeiterIds: ["m1", "m2"] },
  { id: "s5", auftragId: "a2", datum: tagOffset(1), beginnGeplant: "07:00", endeGeplant: "15:00", mitarbeiterIds: ["m1", "m2"] },
  { id: "s6", auftragId: "a3", datum: tagOffset(3), beginnGeplant: "08:00", endeGeplant: "16:30", mitarbeiterIds: ["m3", "m4", "m5"] },
  { id: "s7", auftragId: "a1", datum: tagOffset(2), beginnGeplant: "06:30", endeGeplant: "15:00", mitarbeiterIds: ["m1", "m4", "m6"] },
];

const demoSignatur =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 36'><path d='M6 26 C 18 4, 28 34, 42 18 S 64 6, 74 22 S 96 32, 114 10' fill='none' stroke='#101113' stroke-width='2' stroke-linecap='round'/></svg>`
  );

const demoAudit = (t: string): Audit => ({
  createdAt: t,
  sessionId: "demo-session",
  userAgent: "Demo",
  dokumentHash: "d3m0…",
});

export const eintraege: Eintrag[] = [
  { id: "e1", schichtId: "s1", mitarbeiterId: "m2", checkIn: "07:05", checkOut: "16:00", pauseMin: 30, signatur: demoSignatur, audit: demoAudit(`${isoHeute()}T16:05:00Z`) },
  { id: "e2", schichtId: "s1", mitarbeiterId: "m4", checkIn: "06:55", checkOut: "16:10", pauseMin: 45, signatur: demoSignatur, audit: demoAudit(`${isoHeute()}T16:12:00Z`) },
  { id: "e3", schichtId: "s3", mitarbeiterId: "m5", checkIn: "07:30", checkOut: "15:30", pauseMin: 30, signatur: demoSignatur, audit: demoAudit(`${tagOffset(-1)}T15:34:00Z`) },
  { id: "e4", schichtId: "s3", mitarbeiterId: "m6", checkIn: "07:35", checkOut: "15:20", pauseMin: 30, signatur: demoSignatur, audit: demoAudit(`${tagOffset(-1)}T15:31:00Z`) },
  { id: "e5", schichtId: "s4", mitarbeiterId: "m1", checkIn: "07:00", checkOut: "16:00", pauseMin: 30, signatur: demoSignatur, audit: demoAudit(`${tagOffset(-3)}T16:02:00Z`) },
  { id: "e6", schichtId: "s4", mitarbeiterId: "m2", checkIn: "07:00", checkOut: "15:45", pauseMin: 30, signatur: demoSignatur, audit: demoAudit(`${tagOffset(-3)}T15:50:00Z`) },
];

/* ── Abgeleitete Logik ───────────────────────────────────────────── */

export const getAuftrag = (id: string) => auftraege.find((a) => a.id === id)!;
export const getSchicht = (id: string) => schichten.find((s) => s.id === id);
export const getMitarbeiter = (id: string) => mitarbeiter.find((m) => m.id === id)!;

export function eintragVon(schichtId: string, mitarbeiterId: string, alle: Eintrag[]) {
  return alle.find((e) => e.schichtId === schichtId && e.mitarbeiterId === mitarbeiterId);
}

/** Wie viele haben abgegeben, wie viele fehlen — auf einen Blick. */
export function abgabe(schicht: Schicht, alle: Eintrag[]) {
  const abgegebenIds = schicht.mitarbeiterIds.filter((id) => eintragVon(schicht.id, id, alle));
  const fehlendeIds = schicht.mitarbeiterIds.filter((id) => !abgegebenIds.includes(id));
  return { abgegeben: abgegebenIds.length, gesamt: schicht.mitarbeiterIds.length, abgegebenIds, fehlendeIds };
}

export type SchichtStatus = "geplant" | "offen" | "ueberfaellig" | "vollstaendig";

export function schichtStatus(schicht: Schicht, alle: Eintrag[]): SchichtStatus {
  const { abgegeben, gesamt } = abgabe(schicht, alle);
  if (gesamt > 0 && abgegeben === gesamt) return "vollstaendig";
  const heute = isoHeute();
  if (schicht.datum > heute) return "geplant";
  if (schicht.datum < heute) return "ueberfaellig";
  return "offen";
}

export const statusLabel: Record<SchichtStatus, string> = {
  geplant: "Geplant",
  offen: "Heute offen",
  ueberfaellig: "Überfällig",
  vollstaendig: "Vollständig",
};

/** Summe gearbeiteter Minuten einer Schicht (nur abgegebene Zeilen). */
export function schichtMinuten(schicht: Schicht, alle: Eintrag[]) {
  return alle
    .filter((e) => e.schichtId === schicht.id)
    .reduce((sum, e) => sum + arbeitsMinuten(e.checkIn, e.checkOut, e.pauseMin), 0);
}

/* ── Kompatibilitäts-Exports für bestehende UI-Komponenten ───────── */

export type SheetStatus = "offen" | "eingereicht" | "genehmigt";

export type TimesheetRow = {
  id: string;
  vorname: string;
  nachname: string;
  datum: string;
  checkIn: string;
  checkOut: string;
  pauseMin: number;
  signatur: string;
};

export type TimesheetSheet = {
  id: string;
  projekt: string;
  zeitraum: string;
  status: SheetStatus;
  rows: TimesheetRow[];
};

function mapSchichtStatusZuSheetStatus(status: SchichtStatus): SheetStatus {
  if (status === "vollstaendig") return "genehmigt";
  if (status === "offen") return "offen";
  return "eingereicht";
}

function formatZeitraum(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export const sheets: TimesheetSheet[] = schichten.map((s) => {
  const auftrag = getAuftrag(s.auftragId);
  const rows = eintraege
    .filter((e) => e.schichtId === s.id)
    .map((e) => {
      const m = getMitarbeiter(e.mitarbeiterId);
      return {
        id: e.id,
        vorname: m.vorname,
        nachname: m.nachname,
        datum: s.datum,
        checkIn: e.checkIn,
        checkOut: e.checkOut,
        pauseMin: e.pauseMin,
        signatur: e.signatur,
      };
    });

  return {
    id: s.id,
    projekt: auftrag.titel,
    zeitraum: formatZeitraum(s.datum),
    status: mapSchichtStatusZuSheetStatus(schichtStatus(s, eintraege)),
    rows,
  };
});

export function sheetMinuten(sheet: TimesheetSheet) {
  return sheet.rows.reduce((sum, row) => sum + arbeitsMinuten(row.checkIn, row.checkOut, row.pauseMin), 0);
}

export function appendEintragToSheets(eintrag: Eintrag) {
  const sheet = sheets.find((s) => s.id === eintrag.schichtId);
  const schicht = getSchicht(eintrag.schichtId);
  if (!sheet || !schicht) return;
  const m = getMitarbeiter(eintrag.mitarbeiterId);
  sheet.rows.push({
    id: eintrag.id,
    vorname: m.vorname,
    nachname: m.nachname,
    datum: schicht.datum,
    checkIn: eintrag.checkIn,
    checkOut: eintrag.checkOut,
    pauseMin: eintrag.pauseMin,
    signatur: eintrag.signatur,
  });
  if (sheet.status === "offen") sheet.status = "eingereicht";
}

export const statusLabelSheet: Record<SheetStatus, string> = {
  offen: "Offen",
  eingereicht: "Eingereicht",
  genehmigt: "Genehmigt",
};
