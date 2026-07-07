import { createHmac, timingSafeEqual } from "crypto";

type InvitePayload = {
  schichtId: string;
  mitarbeiterId: string;
  exp: number;
};

function base64UrlEncode(input: string) {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function getInviteSecret() {
  return process.env.INVITE_TOKEN_SECRET || "dev-invite-secret-change-me";
}

export function createInviteToken(params: { schichtId: string; mitarbeiterId: string; expiresInHours?: number }) {
  const exp = Date.now() + (params.expiresInHours ?? 72) * 60 * 60 * 1000;
  const payload: InvitePayload = {
    schichtId: params.schichtId,
    mitarbeiterId: params.mitarbeiterId,
    exp,
  };
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", getInviteSecret()).update(payloadPart).digest("base64url");
  return `${payloadPart}.${signature}`;
}

export function verifyInviteToken(token: string): { ok: true; payload: InvitePayload } | { ok: false; error: string } {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, error: "Ungültiger Link." };
  const [payloadPart, signaturePart] = parts;
  const expectedSignature = createHmac("sha256", getInviteSecret()).update(payloadPart).digest("base64url");

  const sigA = Buffer.from(signaturePart);
  const sigB = Buffer.from(expectedSignature);
  if (sigA.length !== sigB.length || !timingSafeEqual(sigA, sigB)) {
    return { ok: false, error: "Der Link ist ungültig oder manipuliert." };
  }

  let payload: InvitePayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadPart)) as InvitePayload;
  } catch {
    return { ok: false, error: "Der Link konnte nicht gelesen werden." };
  }

  if (!payload.schichtId || !payload.mitarbeiterId || !payload.exp) {
    return { ok: false, error: "Der Link enthält unvollständige Daten." };
  }

  if (Date.now() > payload.exp) {
    return { ok: false, error: "Dieser Link ist abgelaufen." };
  }

  return { ok: true, payload };
}

