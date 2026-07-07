import { verifyToken } from "@/lib/invite-token";
import { getSchichtViewById } from "@/lib/queries";
import { Wizard } from "@/components/wizard/wizard";
import { HinweisCard } from "@/components/hinweis-card";

export const dynamic = "force-dynamic";

/**
 * Mitarbeiter-Questionnaire — erreichbar ausschließlich über den
 * signierten Link, der auf dem A4-Blatt pro Person kopiert wird.
 */
export default async function ErfassenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: raw } = await params;
  const token = decodeURIComponent(raw);

  const v = verifyToken(token, "mitarbeiter");
  if (!v.ok || !v.mitarbeiterId) {
    return (
      <HinweisCard
        titel="Link ungültig"
        text={v.ok ? "Dieser Link enthält keine Personenzuordnung." : v.error}
      />
    );
  }

  const schicht = await getSchichtViewById(v.schichtId);
  const zuweisung = schicht?.zuweisungen.find((z) => z.mitarbeiter.id === v.mitarbeiterId);
  if (!schicht || !zuweisung) {
    return (
      <HinweisCard
        titel="Schicht nicht gefunden"
        text="Dieser Link führt zu keiner bekannten Schicht oder du bist dort nicht eingeteilt."
      />
    );
  }

  return (
    <Wizard
      token={token}
      schicht={{
        id: schicht.id,
        datum: schicht.datum,
        beginnGeplant: schicht.beginnGeplant,
        endeGeplant: schicht.endeGeplant,
      }}
      auftrag={{
        titel: schicht.auftrag.titel,
        auftraggeber: schicht.auftrag.auftraggeber,
        ort: schicht.auftrag.ort,
      }}
      mitarbeiter={zuweisung.mitarbeiter}
      team={schicht.zuweisungen.map((z) => z.mitarbeiter)}
      bereitsAbgegeben={Boolean(zuweisung.eintrag)}
    />
  );
}
