import { createHash, randomUUID } from "crypto";
import { headers } from "next/headers";
import { getDb } from "./db";

export function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

/** User-Agent + IP der aktuellen Anfrage (für den Audit-Stempel). */
export async function requestMeta() {
  try {
    const h = await headers();
    return {
      userAgent: h.get("user-agent") ?? "unbekannt",
      ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "lokal",
    };
  } catch {
    return { userAgent: "system", ip: "system" };
  }
}

/** Signatur-Data-URLs nicht in Klartext loggen — nur als Fingerabdruck. */
function auditWert(wert: string | null | undefined): string | null {
  if (wert == null) return null;
  if (wert.startsWith("data:image")) {
    return `[Signatur · sha256:${sha256(wert).slice(0, 16)}…]`;
  }
  return wert.length > 500 ? `${wert.slice(0, 500)}…` : wert;
}

export type AuditEintrag = {
  entitaet: "eintrag" | "schicht";
  entitaetId: string;
  schichtId?: string;
  aktion: string;
  feld?: string;
  altWert?: string | null;
  neuWert?: string | null;
  akteur: string;
  akteurTyp: "mitarbeiter" | "kunde" | "disposition" | "system";
  dokumentHash?: string | null;
};

/** Pflicht bei jeder Änderung: wer, wann, was, alt → neu. */
export async function logAudit(e: AuditEintrag) {
  const db = await getDb();
  const meta = await requestMeta();
  await db.query(
    `INSERT INTO audit_log
       (id, entitaet, entitaet_id, schicht_id, aktion, feld, alt_wert, neu_wert,
        akteur, akteur_typ, user_agent, ip, dokument_hash, erstellt_am)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      randomUUID(),
      e.entitaet,
      e.entitaetId,
      e.schichtId ?? null,
      e.aktion,
      e.feld ?? null,
      auditWert(e.altWert),
      auditWert(e.neuWert),
      e.akteur,
      e.akteurTyp,
      meta.userAgent,
      meta.ip,
      e.dokumentHash ?? null,
      new Date().toISOString(),
    ]
  );
}
