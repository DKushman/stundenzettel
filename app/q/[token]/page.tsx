import { notFound } from "next/navigation";
import { QuestionnaireForm } from "./questionnaire-form";
import { getAuftrag, getMitarbeiter, getSchicht } from "@/lib/data";
import { verifyInviteToken } from "@/lib/invite-token";

export default async function QuestionnairePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const verification = verifyInviteToken(token);
  if (!verification.ok) {
    return (
      <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-line bg-card p-6 text-center shadow-card">
        <h1 className="text-xl font-semibold">Link ungültig</h1>
        <p className="mt-2 text-sm text-ink-soft">{verification.error}</p>
      </div>
    );
  }

  const { schichtId, mitarbeiterId } = verification.payload;
  const schicht = getSchicht(schichtId);
  const mitarbeiter = getMitarbeiter(mitarbeiterId);
  if (!schicht || !mitarbeiter) notFound();
  const auftrag = getAuftrag(schicht.auftragId);

  return (
    <QuestionnaireForm
      token={token}
      mitarbeiterName={`${mitarbeiter.vorname} ${mitarbeiter.nachname}`}
      schichtLabel={`${auftrag.titel} am ${new Date(`${schicht.datum}T00:00:00`).toLocaleDateString("de-DE")}`}
    />
  );
}

