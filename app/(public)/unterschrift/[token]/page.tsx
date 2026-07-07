import { verifyToken } from "@/lib/invite-token";
import { getSchichtViewById } from "@/lib/queries";
import { KundeSignatur } from "@/components/kunde-signatur";
import { HinweisCard } from "@/components/hinweis-card";

export const dynamic = "force-dynamic";

/**
 * Kunden-Link: Der Auftraggeber sieht das fertige A4-Blatt und
 * zeichnet es digital gegen — ohne Login, per signiertem Link.
 */
export default async function UnterschriftPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: raw } = await params;
  const token = decodeURIComponent(raw);

  const v = verifyToken(token, "kunde");
  if (!v.ok) {
    return <HinweisCard titel="Link ungültig" text={v.error} />;
  }

  const schicht = await getSchichtViewById(v.schichtId);
  if (!schicht) {
    return <HinweisCard titel="Nicht gefunden" text="Dieser Link führt zu keinem bekannten Stundenzettel." />;
  }

  return <KundeSignatur schicht={schicht} token={token} />;
}
