/**
 * E-Mail-Versand über die Resend-HTTP-API (kein extra Paket nötig).
 * Aktiv, sobald RESEND_API_KEY und RESEND_FROM gesetzt sind.
 */

type ErinnerungsMail = {
  an: string;
  betreff: string;
  text: string;
  html: string;
};

export async function sendeErinnerung(mail: ErinnerungsMail): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    return { ok: false, error: "E-Mail nicht konfiguriert (RESEND_API_KEY / RESEND_FROM fehlt)." };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [mail.an],
      subject: mail.betreff,
      text: mail.text,
      html: mail.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, error: `Resend-Fehler (${res.status}): ${body.slice(0, 200)}` };
  }

  return { ok: true };
}

export function erinnerungsMail(params: {
  name: string;
  schichtTitel: string;
  datum: string;
  link: string;
  typ: "mitarbeiter" | "kunde";
}) {
  const { name, schichtTitel, datum, link, typ } = params;
  const betreff =
    typ === "mitarbeiter"
      ? `Erinnerung: Stundenzettel für ${schichtTitel}`
      : `Erinnerung: Stundenzettel gegenzeichnen — ${schichtTitel}`;

  const einleitung =
    typ === "mitarbeiter"
      ? `Hallo ${name},\n\ndein Stundenzettel für „${schichtTitel}" am ${datum} wurde noch nicht abgegeben.`
      : `Guten Tag ${name},\n\nder Stundenzettel für „${schichtTitel}" am ${datum} wartet noch auf Ihre Gegenzeichnung.`;

  const text = `${einleitung}\n\nBitte hier öffnen:\n${link}\n\nVielen Dank!`;
  const html = `
    <p>${einleitung.replace(/\n/g, "<br>")}</p>
    <p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#101113;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Jetzt öffnen</a></p>
    <p style="color:#666;font-size:13px">Oder Link kopieren: <a href="${link}">${link}</a></p>
  `.trim();

  return { betreff, text, html };
}
