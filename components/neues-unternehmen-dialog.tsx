"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { unternehmenAnlegen } from "@/lib/actions";
import { useAppData } from "@/lib/app-data-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NeuesUnternehmenButton() {
  const [offen, setOffen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOffen(true)}
        className="mt-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-line px-2.5 py-2 text-left text-[clamp(0.75rem,2vw,0.85rem)] font-medium text-ink-soft transition-colors hover:border-ink/30 hover:bg-surface hover:text-ink"
      >
        <Plus className="h-4 w-4 shrink-0" />
        Neues Unternehmen
      </button>

      {offen && <NeuesUnternehmenDialog onClose={() => setOffen(false)} />}
    </>
  );
}

function NeuesUnternehmenDialog({ onClose }: { onClose: () => void }) {
  const fetchDashboard = useAppData((s) => s.fetchDashboard);
  const setAuftragId = useAppData((s) => s.setAuftragId);
  const [pending, startTransition] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFehler(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await unternehmenAnlegen({
        auftraggeber: String(fd.get("auftraggeber") ?? ""),
        titel: String(fd.get("titel") ?? ""),
        ort: String(fd.get("ort") ?? ""),
        ansprechpartner: String(fd.get("ansprechpartner") ?? "") || undefined,
        email: String(fd.get("email") ?? "") || undefined,
      });

      if (!result.ok) {
        setFehler(result.error);
        return;
      }

      await fetchDashboard({ force: true });
      setAuftragId(result.id);
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-line bg-card p-5 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Neues Unternehmen</h2>
            <p className="mt-0.5 text-sm text-ink-soft">Auftraggeber und Projekt anlegen.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-soft hover:bg-surface"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="auftraggeber">Unternehmen</Label>
            <Input id="auftraggeber" name="auftraggeber" required placeholder="z. B. Weber Bau GmbH" />
          </div>
          <div>
            <Label htmlFor="titel">Projekt / Titel</Label>
            <Input id="titel" name="titel" required placeholder="z. B. Fassadensanierung" />
          </div>
          <div>
            <Label htmlFor="ort">Einsatzort</Label>
            <Input id="ort" name="ort" required placeholder="z. B. Berlin-Mitte" />
          </div>
          <div>
            <Label htmlFor="ansprechpartner">
              Ansprechpartner <span className="font-normal text-ink-faint">(optional)</span>
            </Label>
            <Input id="ansprechpartner" name="ansprechpartner" placeholder="Name" />
          </div>
          <div>
            <Label htmlFor="email">
              E-Mail <span className="font-normal text-ink-faint">(optional)</span>
            </Label>
            <Input id="email" name="email" type="email" placeholder="kontakt@firma.de" />
          </div>

          {fehler && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{fehler}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? "Wird angelegt …" : "Anlegen"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
