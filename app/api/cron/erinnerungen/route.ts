import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import { getSchichtViews, erinnerungKuerzlichGesendet } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron (stündlich, siehe vercel.json):
 * Findet Stundenzettel, die 24 h nach Schichtende noch offen sind, und
 * protokolliert pro Ziel höchstens eine Erinnerung je 24 h.
 *
 * Versand: aktuell werden die Erinnerungen geloggt und im Dashboard
 * angezeigt (Links zum Kopieren). Ein E-Mail-Provider (z. B. Resend)
 * kann später an der markierten Stelle eingehängt werden.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const origin = request.nextUrl.origin;
  const views = await getSchichtViews();
  const neu: { schichtId: string; typ: string; name: string; link: string }[] = [];

  for (const schicht of views) {
    for (const f of schicht.faelligeErinnerungen) {
      const schonGesendet = await erinnerungKuerzlichGesendet(
        schicht.id,
        f.mitarbeiterId ?? null,
        f.typ
      );
      if (schonGesendet) continue;

      await query(
        `INSERT INTO erinnerungen (id, schicht_id, mitarbeiter_id, typ, kanal, erstellt_am)
         VALUES ($1,$2,$3,$4,'log',$5)`,
        [randomUUID(), schicht.id, f.mitarbeiterId ?? null, f.typ, new Date().toISOString()]
      );

      const link = `${origin}${f.pfad}`;
      neu.push({ schichtId: schicht.id, typ: f.typ, name: f.name, link });

      // ── Hier später E-Mail-Versand einhängen (z. B. Resend) ─────────
      // await resend.emails.send({ to: ..., subject: "Erinnerung: Stundenzettel", ... });
    }
  }

  return NextResponse.json({
    ok: true,
    geprueft: views.length,
    erinnerungen: neu,
  });
}
