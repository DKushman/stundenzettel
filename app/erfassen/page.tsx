import Link from "next/link";
import { schichten, getAuftrag } from "@/lib/data";

export default function ErfassenPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Zeit erfassen</h1>
      <p className="mt-2 text-sm text-ink-soft">Wähle eine Schicht aus, um den Stundenzettel auszufüllen.</p>
      <ul className="mt-6 space-y-3">
        {schichten.map((s) => {
          const auftrag = getAuftrag(s.auftragId);
          return (
            <li key={s.id}>
              <Link
                href={`/erfassen/${s.id}`}
                className="block rounded-xl border border-line bg-card p-4 shadow-card hover:bg-surface"
              >
                <p className="font-medium">{auftrag.titel}</p>
                <p className="text-sm text-ink-soft">{new Date(`${s.datum}T00:00:00`).toLocaleDateString("de-DE")}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
