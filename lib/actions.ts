"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { invalidateSchichtCache, invalidateUnternehmenCache } from "./invalidate";
import { query } from "./db";
import { logAudit, sha256 } from "./audit";
import { verifyToken } from "./invite-token";
import { arbeitsMinuten } from "./time";

/* ────────────────────────────────────────────────────────────────────
 * Server Actions für das Dashboard (Disposition) und den Kunden-Link.
 * Jede Änderung landet im Audit-Log: wer, wann, was, alt → neu.
 * ──────────────────────────────────────────────────────────────────── */

const FELD_SPALTE = {
  checkIn: "check_in",
  checkOut: "check_out",
  pauseMin: "pause_min",
  notiz: "notiz",
} as const;

export type EditierbaresFeld = keyof typeof FELD_SPALTE;

const ZEIT_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function feldPruefen(feld: EditierbaresFeld, wert: string): string | null {
  if (feld === "checkIn" || feld === "checkOut") {
    if (!ZEIT_REGEX.test(wert)) return "Bitte eine Uhrzeit im Format HH:MM angeben.";
  }
  if (feld === "pauseMin") {
    const n = Number(wert);
    if (!Number.isInteger(n) || n < 0 || n > 480) return "Pause muss zwischen 0 und 480 Minuten liegen.";
  }
  if (feld === "notiz" && wert.length > 200) return "Notiz maximal 200 Zeichen.";
  return null;
}

type EintragRow = {
  id: string;
  check_in: string;
  check_out: string;
  pause_min: number;
  notiz: string | null;
};

/**
 * Inline-Bearbeitung auf dem A4-Blatt. Existiert noch kein Eintrag für
 * die Person, wird einer angelegt (Quelle: Disposition, ohne Signatur).
 */
export async function eintragFeldSpeichern(input: {
  schichtId: string;
  mitarbeiterId: string;
  feld: EditierbaresFeld;
  wert: string;
}) {
  const { schichtId, mitarbeiterId, feld } = input;
  const wert = input.wert.trim();

  if (!(feld in FELD_SPALTE)) return { ok: false as const, error: "Unbekanntes Feld." };
  const fehler = feldPruefen(feld, wert);
  if (fehler) return { ok: false as const, error: fehler };

  const [ma] = await query<{ vorname: string; nachname: string }>(
    `SELECT vorname, nachname FROM mitarbeiter WHERE id = $1`,
    [mitarbeiterId]
  );
  if (!ma) return { ok: false as const, error: "Mitarbeiter nicht gefunden." };

  const [zu] = await query(
    `SELECT 1 FROM schicht_mitarbeiter WHERE schicht_id=$1 AND mitarbeiter_id=$2`,
    [schichtId, mitarbeiterId]
  );
  if (!zu) return { ok: false as const, error: "Diese Person ist der Schicht nicht zugewiesen." };

  const [vorhanden] = await query<EintragRow>(
    `SELECT id, check_in, check_out, pause_min, notiz FROM eintraege
     WHERE schicht_id=$1 AND mitarbeiter_id=$2`,
    [schichtId, mitarbeiterId]
  );

  const jetzt = new Date().toISOString();
  const spalte = FELD_SPALTE[feld];
  const neuerWert = feld === "pauseMin" ? String(Number(wert)) : wert;

  if (!vorhanden) {
    const [schicht] = await query<{ beginn_geplant: string; ende_geplant: string }>(
      `SELECT beginn_geplant, ende_geplant FROM schichten WHERE id=$1`,
      [schichtId]
    );
    if (!schicht) return { ok: false as const, error: "Schicht nicht gefunden." };

    const basis = {
      check_in: schicht.beginn_geplant,
      check_out: schicht.ende_geplant,
      pause_min: 30,
      notiz: null as string | null,
    };
    (basis as Record<string, unknown>)[spalte] = feld === "pauseMin" ? Number(neuerWert) : neuerWert;

    const id = randomUUID();
    await query(
      `INSERT INTO eintraege (id, schicht_id, mitarbeiter_id, check_in, check_out, pause_min, notiz, quelle, erstellt_am)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'disposition',$8)`,
      [id, schichtId, mitarbeiterId, basis.check_in, basis.check_out, basis.pause_min, basis.notiz, jetzt]
    );
    await logAudit({
      entitaet: "eintrag",
      entitaetId: id,
      schichtId,
      aktion: "erstellt",
      feld,
      altWert: null,
      neuWert: neuerWert,
      akteur: `Disposition (für ${ma.vorname} ${ma.nachname})`,
      akteurTyp: "disposition",
    });
  } else {
    const altWert =
      feld === "pauseMin"
        ? String(vorhanden.pause_min)
        : String((vorhanden as unknown as Record<string, unknown>)[spalte] ?? "");
    if (altWert === neuerWert) return { ok: true as const };

    // Plausibilität: Check-out nach Check-in, Pause kürzer als Anwesenheit
    const checkIn = feld === "checkIn" ? neuerWert : vorhanden.check_in;
    const checkOut = feld === "checkOut" ? neuerWert : vorhanden.check_out;
    const pause = feld === "pauseMin" ? Number(neuerWert) : Number(vorhanden.pause_min);
    if (checkOut <= checkIn) return { ok: false as const, error: "Check-out muss nach dem Check-in liegen." };
    if (arbeitsMinuten(checkIn, checkOut, 0) <= pause)
      return { ok: false as const, error: "Die Pause ist länger als die gesamte Anwesenheit." };

    await query(
      `UPDATE eintraege SET ${spalte} = $1, geaendert_am = $2 WHERE id = $3`,
      [feld === "pauseMin" ? Number(neuerWert) : neuerWert, jetzt, vorhanden.id]
    );
    await logAudit({
      entitaet: "eintrag",
      entitaetId: vorhanden.id,
      schichtId,
      aktion: "geaendert",
      feld,
      altWert,
      neuWert: neuerWert,
      akteur: `Disposition (Eintrag von ${ma.vorname} ${ma.nachname})`,
      akteurTyp: "disposition",
    });
  }

  invalidateSchichtCache();
  revalidatePath("/");
  revalidatePath(`/stundenzettel/${schichtId}`);
  return { ok: true as const };
}

/** Kunden-Unterschrift über den signierten Link — zeichnet das ganze Blatt gegen. */
export async function kundeUnterschreiben(input: {
  token: string;
  name: string;
  signatur: string;
}) {
  const v = verifyToken(input.token, "kunde");
  if (!v.ok) return { ok: false as const, error: v.error };

  const name = input.name.trim();
  if (name.length < 2) return { ok: false as const, error: "Bitte den Namen angeben." };
  if (!input.signatur.startsWith("data:image"))
    return { ok: false as const, error: "Unterschrift fehlt." };

  const [schicht] = await query<{ id: string; kunde_signatur: string | null }>(
    `SELECT id, kunde_signatur FROM schichten WHERE id = $1`,
    [v.schichtId]
  );
  if (!schicht) return { ok: false as const, error: "Schicht nicht gefunden." };
  if (schicht.kunde_signatur)
    return { ok: false as const, error: "Dieser Stundenzettel wurde bereits unterschrieben." };

  const eintraege = await query(
    `SELECT id, mitarbeiter_id, check_in, check_out, pause_min, dokument_hash
     FROM eintraege WHERE schicht_id = $1 ORDER BY mitarbeiter_id`,
    [v.schichtId]
  );

  const jetzt = new Date().toISOString();
  // Hash bindet die Kunden-Unterschrift an den aktuellen Stand aller Einträge
  const dokumentHash = sha256(
    JSON.stringify({ schichtId: v.schichtId, eintraege, name, signatur: input.signatur, jetzt })
  );

  await query(
    `UPDATE schichten
     SET kunde_name=$1, kunde_signatur=$2, kunde_unterschrieben_am=$3, kunde_dokument_hash=$4
     WHERE id=$5`,
    [name, input.signatur, jetzt, dokumentHash, v.schichtId]
  );
  await logAudit({
    entitaet: "schicht",
    entitaetId: v.schichtId,
    schichtId: v.schichtId,
    aktion: "kunde_unterschrieben",
    akteur: name,
    akteurTyp: "kunde",
    dokumentHash,
  });

  invalidateSchichtCache();
  revalidatePath("/");
  revalidatePath(`/stundenzettel/${v.schichtId}`);
  return { ok: true as const, unterschriebenAm: jetzt };
}

const UNTERNEHMEN_FARBEN = [
  "#3B82F6",
  "#8B5CF6",
  "#F59E0B",
  "#EC4899",
  "#10B981",
  "#6366F1",
  "#E28412",
  "#1CA97A",
];

/** Neues Unternehmen / Auftrag anlegen (Sidebar). */
export async function unternehmenAnlegen(input: {
  auftraggeber: string;
  titel: string;
  ort: string;
  ansprechpartner?: string;
  email?: string;
}) {
  const auftraggeber = input.auftraggeber.trim();
  const titel = input.titel.trim();
  const ort = input.ort.trim();
  const ansprechpartner = input.ansprechpartner?.trim() || null;
  const email = input.email?.trim() || null;

  if (auftraggeber.length < 2) {
    return { ok: false as const, error: "Bitte den Unternehmensnamen angeben." };
  }
  if (titel.length < 2) {
    return { ok: false as const, error: "Bitte einen Projekttitel angeben." };
  }
  if (ort.length < 2) {
    return { ok: false as const, error: "Bitte den Einsatzort angeben." };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, error: "Bitte eine gültige E-Mail angeben." };
  }

  const id = randomUUID();
  const farbe = UNTERNEHMEN_FARBEN[Math.floor(Math.random() * UNTERNEHMEN_FARBEN.length)];

  await query(
    `INSERT INTO auftraege (id, titel, auftraggeber, ansprechpartner, email, ort, farbe)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, titel, auftraggeber, ansprechpartner, email, ort, farbe]
  );

  invalidateUnternehmenCache();
  revalidatePath("/");
  return { ok: true as const, id };
}
