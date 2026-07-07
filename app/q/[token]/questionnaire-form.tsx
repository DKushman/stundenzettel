"use client";

import { useState, useTransition } from "react";
import { SignatureModal } from "@/components/signature-modal";
import { submitInviteQuestionnaire } from "@/lib/invite-actions";

export function QuestionnaireForm({
  token,
  mitarbeiterName,
  schichtLabel,
}: {
  token: string;
  mitarbeiterName: string;
  schichtLabel: string;
}) {
  const [bestaetigt, setBestaetigt] = useState(false);
  const [richtigkeit, setRichtigkeit] = useState(false);
  const [checkIn, setCheckIn] = useState("07:00");
  const [checkOut, setCheckOut] = useState("16:00");
  const [pauseMin, setPauseMin] = useState(30);
  const [notiz, setNotiz] = useState("");
  const [signatur, setSignatur] = useState("");
  const [modalOffen, setModalOffen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mx-auto max-w-2xl rounded-2xl border border-line bg-card p-6 shadow-card"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        startTransition(async () => {
          const result = await submitInviteQuestionnaire({
            token,
            bestaetigt,
            richtigkeit,
            checkIn,
            checkOut,
            pauseMin,
            notiz,
            signatur,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setSuccess("Danke! Dein Stundenzettel wurde erfolgreich eingereicht und im A4-Dokument gespeichert.");
        });
      }}
    >
      <h1 className="text-2xl font-semibold tracking-tight">Stundenzettel Fragebogen</h1>
      <p className="mt-2 text-sm text-ink-soft">{mitarbeiterName} · {schichtLabel}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Check-in</span>
          <input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="h-11 w-full rounded-xl border border-line px-3" required />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Check-out</span>
          <input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="h-11 w-full rounded-xl border border-line px-3" required />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Pause (Min.)</span>
          <input type="number" min={0} max={480} value={pauseMin} onChange={(e) => setPauseMin(Number(e.target.value))} className="h-11 w-full rounded-xl border border-line px-3" required />
        </label>
      </div>

      <label className="mt-4 block text-sm">
        <span className="mb-1 block font-medium">Notiz (optional)</span>
        <textarea value={notiz} onChange={(e) => setNotiz(e.target.value)} rows={3} className="w-full rounded-xl border border-line px-3 py-2" />
      </label>

      <button type="button" onClick={() => setModalOffen(true)} className="mt-4 w-full rounded-xl border border-dashed border-line px-4 py-6 text-sm">
        {signatur ? "Unterschrift erfasst - neu unterschreiben" : "Hier unterschreiben"}
      </button>

      <label className="mt-4 flex items-start gap-2 text-sm">
        <input type="checkbox" checked={bestaetigt} onChange={(e) => setBestaetigt(e.target.checked)} className="mt-0.5" />
        Ich bestätige, dass ich in dieser Schicht gearbeitet habe.
      </label>
      <label className="mt-2 flex items-start gap-2 text-sm">
        <input type="checkbox" checked={richtigkeit} onChange={(e) => setRichtigkeit(e.target.checked)} className="mt-0.5" />
        Ich bestätige die Richtigkeit meiner Angaben.
      </label>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p>}

      <button type="submit" disabled={pending} className="mt-5 h-11 w-full rounded-xl bg-ink font-medium text-white disabled:opacity-60">
        {pending ? "Wird gesendet..." : "Eintrag absenden"}
      </button>

      <SignatureModal
        open={modalOffen}
        onClose={() => setModalOffen(false)}
        onConfirm={(dataUrl) => setSignatur(dataUrl)}
      />
    </form>
  );
}

