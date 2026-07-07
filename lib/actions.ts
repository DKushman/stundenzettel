"use server";

import { createHash, randomUUID } from "crypto";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eintragSchema, type EintragInput } from "./validations";
import { appendEintragToSheets, getSchicht, eintraege as vorhandene, type Eintrag } from "./data";
import { arbeitsMinuten } from "./time";

/* ────────────────────────────────────────────────────────────────────
 * Server Action: Stundenzettel einreichen (DocuSign-Logik)
 *
 * Antwort auf die drei Kernfragen:
 *
 * 1) GATEKEEPING passiert doppelt: der Wizard validiert jeden Step
 *    clientseitig (zod pro Step), und HIER wird ALLES erneut geprüft —
 *    inkl. "ist der Mitarbeiter überhaupt in dieser Schicht eingeteilt?"
 *    und "hat er schon abgegeben?". Client-Checks sind Komfort,
 *    Server-Checks sind die Wahrheit.
 *
 * 2) AUDIT-STEMPEL: created_at, Session-ID (Cookie, sonst neu erzeugt),
 *    User-Agent und IP werden serverseitig erfasst — der Client kann
 *    sie nicht manipulieren.
 *
 * 3) SIGNATUR + FELDER = EIN DOKUMENT: Die Unterschrift (PNG-Data-URL)
 *    wird als Spalte IM SELBEN Datensatz gespeichert wie die Zeitdaten
 *    (eine Zeile in `timesheet_eintraege`). Zusätzlich wird ein
 *    SHA-256-Hash über die kanonisch serialisierten Felder INKLUSIVE
 *    der Signatur berechnet und mitgespeichert. Damit ist kryptografisch
 *    belegbar, dass genau diese Unterschrift zu genau diesen Werten
 *    gehört — wird später ein Feld verändert, passt der Hash nicht mehr.
 * ──────────────────────────────────────────────────────────────────── */

export async function submitStundenzettel(input: EintragInput) {
  // ── 1. Vollständige Validierung (Gatekeeping, Stufe 1) ────────────
  const parsed = eintragSchema.safeParse(input);
  if (!parsed.success) {
    return fehler(parsed.error.issues[0]?.message ?? "Ungültige Eingabe.");
  }
  const data = parsed.data;

  // ── 2. Fachliche Prüfungen (Gatekeeping, Stufe 2) ─────────────────
  const schicht = getSchicht(data.schichtId);
  if (!schicht) return fehler("Diese Schicht existiert nicht.");

  if (!schicht.mitarbeiterIds.includes(data.mitarbeiterId)) {
    return fehler("Du bist in dieser Schicht nicht eingeteilt und kannst keinen Stundenzettel abgeben.");
  }

  // Doppel-Abgabe-Schutz (mit DB: UNIQUE(schicht_id, mitarbeiter_id))
  const schonDa = vorhandene.some(
    (e) => e.schichtId === data.schichtId && e.mitarbeiterId === data.mitarbeiterId
  );
  if (schonDa) return fehler("Für diese Schicht wurde bereits ein Stundenzettel abgegeben.");

  // ── 3. Audit-Stempel serverseitig erzeugen ────────────────────────
  const h = await headers();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sz_session")?.value ?? randomUUID();
  const userAgent = h.get("user-agent") ?? "unbekannt";
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unbekannt";
  const createdAt = new Date().toISOString();
  const gearbeiteteMin = arbeitsMinuten(data.checkIn, data.checkOut, data.pauseMin);

  // ── 4. Dokument-Hash: bindet Unterschrift an die Felder ──────────
  const kanonisch = JSON.stringify({
    schichtId: data.schichtId,
    mitarbeiterId: data.mitarbeiterId,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    pauseMin: data.pauseMin,
    notiz: data.notiz ?? "",
    signatur: data.signatur, // die Signatur ist Teil des gehashten Dokuments
    createdAt,
  });
  const dokumentHash = createHash("sha256").update(kanonisch).digest("hex");

  const eintrag: Eintrag = {
    id: `e_${randomUUID()}`,
    schichtId: data.schichtId,
    mitarbeiterId: data.mitarbeiterId,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    pauseMin: data.pauseMin,
    notiz: data.notiz || undefined,
    signatur: data.signatur,
    audit: { createdAt, sessionId, userAgent, dokumentHash },
  };

  // ── 5. Persistenz (Vercel Postgres) ───────────────────────────────
  //
  //    CREATE TABLE timesheet_eintraege (
  //      id              TEXT PRIMARY KEY,
  //      schicht_id      TEXT NOT NULL REFERENCES schichten(id),
  //      mitarbeiter_id  TEXT NOT NULL REFERENCES mitarbeiter(id),
  //      check_in        TIME NOT NULL,
  //      check_out       TIME NOT NULL,
  //      pause_min       INT  NOT NULL DEFAULT 0,
  //      gearbeitete_min INT  NOT NULL,
  //      notiz           TEXT,
  //      signatur        TEXT NOT NULL,           -- PNG-Data-URL: gleiche Zeile wie die Felder
  //      -- Audit-Spalten (Integrität der Unterschrift):
  //      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  //      session_id      TEXT NOT NULL,
  //      user_agent      TEXT NOT NULL,
  //      ip              TEXT,
  //      dokument_hash   CHAR(64) NOT NULL,       -- SHA-256 über Felder + Signatur
  //      UNIQUE (schicht_id, mitarbeiter_id)      -- Doppel-Abgabe-Schutz auf DB-Ebene
  //    );
  //
  //    import { sql } from "@vercel/postgres";
  //    await sql`
  //      INSERT INTO timesheet_eintraege
  //        (id, schicht_id, mitarbeiter_id, check_in, check_out, pause_min,
  //         gearbeitete_min, notiz, signatur,
  //         created_at, session_id, user_agent, ip, dokument_hash)
  //      VALUES
  //        (${eintrag.id}, ${data.schichtId}, ${data.mitarbeiterId},
  //         ${data.checkIn}, ${data.checkOut}, ${data.pauseMin},
  //         ${gearbeiteteMin}, ${data.notiz ?? null}, ${data.signatur},
  //         ${createdAt}, ${sessionId}, ${userAgent}, ${ip}, ${dokumentHash})
  //    `;
  //
  //    Signatur-Größe: Bei vielen Nutzern die Data-URL in Vercel Blob
  //    auslagern (`@vercel/blob`) und hier nur die URL speichern —
  //    der Hash wird dann über die Blob-URL + Felder gebildet.
  // ───────────────────────────────────────────────────────────────────

  console.log("Stundenzettel eingereicht:", {
    ...eintrag,
    signatur: "[png]",
    gearbeiteteMin,
    ip,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/q`);
  revalidatePath(`/schicht/${data.schichtId}`);
  revalidatePath(`/stundenzettel/${data.schichtId}`);

  vorhandene.push(eintrag);
  appendEintragToSheets(eintrag);

  return { ok: true as const, eintrag, gearbeiteteMin };
}

function fehler(error: string) {
  return { ok: false as const, error };
}
