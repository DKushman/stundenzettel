import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { invalidateSchichtCache } from "@/lib/invalidate";
import { z } from "zod";
import { query } from "@/lib/db";
import { verifyToken } from "@/lib/invite-token";
import { logAudit, requestMeta, sha256 } from "@/lib/audit";
import { arbeitsMinuten } from "@/lib/time";

export const dynamic = "force-dynamic";

/**
 * Abgabe des Mitarbeiter-Questionnaires.
 * Bewusst eine API-Route (statt Server Action), damit die Offline-Queue
 * der PWA die Abgabe später per fetch() nachholen kann.
 */

const eintragSchema = z
  .object({
    token: z.string().min(10),
    checkIn: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ungültige Check-in-Zeit."),
    checkOut: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ungültige Check-out-Zeit."),
    pauseMin: z.number().int().min(0).max(480),
    notiz: z.string().max(200).optional().default(""),
    signatur: z.string().startsWith("data:image", "Unterschrift fehlt.").min(50),
    bestaetigt: z.literal(true),
    richtigkeit: z.literal(true),
    erfasstAmClient: z.string().optional(),
  })
  .refine((d) => d.checkOut > d.checkIn, { message: "Check-out muss nach dem Check-in liegen." })
  .refine((d) => arbeitsMinuten(d.checkIn, d.checkOut, 0) > d.pauseMin, {
    message: "Die Pause ist länger als die gesamte Anwesenheit.",
  });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
  }

  const parsed = eintragSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // Gatekeeping: Der signierte Token IST die Berechtigung
  const v = verifyToken(data.token, "mitarbeiter");
  if (!v.ok || !v.mitarbeiterId) {
    return NextResponse.json({ ok: false, error: v.ok ? "Ungültiger Link." : v.error }, { status: 403 });
  }

  const [zu] = await query<{ vorname: string; nachname: string }>(
    `SELECT m.vorname, m.nachname FROM schicht_mitarbeiter z
     JOIN mitarbeiter m ON m.id = z.mitarbeiter_id
     WHERE z.schicht_id=$1 AND z.mitarbeiter_id=$2`,
    [v.schichtId, v.mitarbeiterId]
  );
  if (!zu) {
    return NextResponse.json(
      { ok: false, error: "Du bist in dieser Schicht nicht eingeteilt." },
      { status: 403 }
    );
  }

  const [schon] = await query(
    `SELECT 1 FROM eintraege WHERE schicht_id=$1 AND mitarbeiter_id=$2`,
    [v.schichtId, v.mitarbeiterId]
  );
  if (schon) {
    return NextResponse.json(
      { ok: false, error: "Für diese Schicht wurde bereits ein Stundenzettel abgegeben." },
      { status: 409 }
    );
  }

  const meta = await requestMeta();
  const erstelltAm = new Date().toISOString();
  const id = randomUUID();

  // Dokument-Hash: bindet die Unterschrift kryptografisch an die Felder
  const dokumentHash = sha256(
    JSON.stringify({
      schichtId: v.schichtId,
      mitarbeiterId: v.mitarbeiterId,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      pauseMin: data.pauseMin,
      notiz: data.notiz ?? "",
      signatur: data.signatur,
      erstelltAm,
    })
  );

  await query(
    `INSERT INTO eintraege
       (id, schicht_id, mitarbeiter_id, check_in, check_out, pause_min, notiz,
        signatur, quelle, dokument_hash, session_id, user_agent, ip, erstellt_am)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'mitarbeiter',$9,$10,$11,$12,$13)`,
    [
      id,
      v.schichtId,
      v.mitarbeiterId,
      data.checkIn,
      data.checkOut,
      data.pauseMin,
      data.notiz || null,
      data.signatur,
      dokumentHash,
      randomUUID(),
      meta.userAgent,
      meta.ip,
      erstelltAm,
    ]
  );

  await logAudit({
    entitaet: "eintrag",
    entitaetId: id,
    schichtId: v.schichtId,
    aktion: data.erfasstAmClient ? "erstellt (offline nachsynchronisiert)" : "erstellt",
    akteur: `${zu.vorname} ${zu.nachname}`,
    akteurTyp: "mitarbeiter",
    dokumentHash,
  });

  invalidateSchichtCache();
  revalidatePath("/");
  revalidatePath(`/stundenzettel/${v.schichtId}`);

  return NextResponse.json({
    ok: true,
    eintragId: id,
    dokumentHash,
    erstelltAm,
    minuten: arbeitsMinuten(data.checkIn, data.checkOut, data.pauseMin),
  });
}
