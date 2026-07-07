"use server";

import { submitStundenzettel } from "./actions";
import { verifyInviteToken } from "./invite-token";

type InviteInput = {
  token: string;
  bestaetigt: boolean;
  richtigkeit: boolean;
  checkIn: string;
  checkOut: string;
  pauseMin: number;
  notiz?: string;
  signatur: string;
};

export async function submitInviteQuestionnaire(input: InviteInput) {
  const verification = verifyInviteToken(input.token);
  if (!verification.ok) return { ok: false as const, error: verification.error };

  const { schichtId, mitarbeiterId } = verification.payload;
  return submitStundenzettel({
    schichtId,
    mitarbeiterId,
    bestaetigt: input.bestaetigt,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    pauseMin: input.pauseMin,
    notiz: input.notiz ?? "",
    richtigkeit: input.richtigkeit,
    signatur: input.signatur,
  });
}

