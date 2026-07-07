import { createHmac, timingSafeEqual } from "crypto";
import { getTokenSecret } from "./env";

/**
 * Signierte, zustandslose Links (HMAC-SHA256) — es müssen keine Tokens
 * in der Datenbank verwaltet werden:
 *
 * - Mitarbeiter-Link:  /erfassen/<token>      (Questionnaire für genau eine Schicht)
 * - Kunden-Link:       /unterschrift/<token>  (A4-Blatt gegenzeichnen)
 */

export type TokenTyp = "mitarbeiter" | "kunde";

type TokenPayload = {
  typ: TokenTyp;
  schichtId: string;
  mitarbeiterId?: string;
  exp: number;
};

const b64e = (s: string) => Buffer.from(s).toString("base64url");
const b64d = (s: string) => Buffer.from(s, "base64url").toString("utf8");

function sign(payloadPart: string) {
  return createHmac("sha256", getTokenSecret()).update(payloadPart).digest("base64url");
}

function createToken(payload: Omit<TokenPayload, "exp">, expiresInHours: number) {
  const part = b64e(
    JSON.stringify({ ...payload, exp: Date.now() + expiresInHours * 3_600_000 })
  );
  return `${part}.${sign(part)}`;
}

/** Link-Token für den Mitarbeiter-Questionnaire (14 Tage gültig). */
export function mitarbeiterToken(schichtId: string, mitarbeiterId: string) {
  return createToken({ typ: "mitarbeiter", schichtId, mitarbeiterId }, 24 * 14);
}

/** Link-Token für die Kunden-Unterschrift (30 Tage gültig). */
export function kundenToken(schichtId: string) {
  return createToken({ typ: "kunde", schichtId }, 24 * 30);
}

export type TokenErgebnis =
  | { ok: true; schichtId: string; mitarbeiterId?: string }
  | { ok: false; error: string };

export function verifyToken(token: string, typ: TokenTyp): TokenErgebnis {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, error: "Ungültiger Link." };

  const [part, sig] = parts;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(part));
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, error: "Der Link ist ungültig oder wurde verändert." };
  }

  let p: TokenPayload;
  try {
    p = JSON.parse(b64d(part)) as TokenPayload;
  } catch {
    return { ok: false, error: "Der Link konnte nicht gelesen werden." };
  }

  if (p.typ !== typ || !p.schichtId) {
    return { ok: false, error: "Der Link passt nicht zu dieser Seite." };
  }
  if (Date.now() > p.exp) {
    return { ok: false, error: "Dieser Link ist abgelaufen. Bitte einen neuen anfordern." };
  }
  return { ok: true, schichtId: p.schichtId, mitarbeiterId: p.mitarbeiterId };
}
