import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import { erinnerungsMail, sendeErinnerung } from "@/lib/email";
import { getAppOrigin, getCronSecret, isProduction } from "@/lib/env";
import { getSchichtViews, erinnerungKuerzlichGesendet } from "@/lib/queries";
import { formatDatumKurz } from "@/lib/time";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron (stündlich, siehe vercel.json):
 * Findet Stundenzettel, die 24 h nach Schichtende noch offen sind.
 * Versendet E-Mails über Resend (falls konfiguriert), sonst Dashboard-Log.
 */
export async function GET(request: NextRequest) {
  const secret = getCronSecret();
  if (isProduction() || secret) {
    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const origin = getAppOrigin(request.nextUrl.origin);
  const views = await getSchichtViews();
  const neu: {
    schichtId: string;
    typ: string;
    name: string;
    link: string;
    kanal: "email" | "log";
    emailFehler?: string;
  }[] = [];

  for (const schicht of views) {
    for (const f of schicht.faelligeErinnerungen) {
      const schonGesendet = await erinnerungKuerzlichGesendet(
        schicht.id,
        f.mitarbeiterId ?? null,
        f.typ
      );
      if (schonGesendet) continue;

      const link = `${origin}${f.pfad}`;
      let kanal: "email" | "log" = "log";
      let emailFehler: string | undefined;

      if (f.email) {
        const mail = erinnerungsMail({
          name: f.name,
          schichtTitel: schicht.auftrag.titel,
          datum: formatDatumKurz(schicht.datum),
          link,
          typ: f.typ,
        });
        const gesendet = await sendeErinnerung({
          an: f.email,
          betreff: mail.betreff,
          text: mail.text,
          html: mail.html,
        });
        if (gesendet.ok) {
          kanal = "email";
        } else {
          emailFehler = gesendet.error;
        }
      }

      await query(
        `INSERT INTO erinnerungen (id, schicht_id, mitarbeiter_id, typ, kanal, erstellt_am)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [randomUUID(), schicht.id, f.mitarbeiterId ?? null, f.typ, kanal, new Date().toISOString()]
      );

      neu.push({
        schichtId: schicht.id,
        typ: f.typ,
        name: f.name,
        link,
        kanal,
        emailFehler,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    geprueft: views.length,
    erinnerungen: neu,
  });
}
