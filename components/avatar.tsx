import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Mitarbeiter } from "@/lib/data";

export function Avatar({
  person,
  size = 32,
  abgegeben,
}: {
  person: Mitarbeiter;
  size?: number;
  abgegeben?: boolean;
}) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-card"
      style={{
        width: size,
        height: size,
        backgroundColor: person.farbe,
        fontSize: size * 0.38,
      }}
      title={`${person.vorname} ${person.nachname}${abgegeben === undefined ? "" : abgegeben ? " — abgegeben" : " — ausstehend"}`}
    >
      {person.vorname[0]}
      {person.nachname[0]}
      {abgegeben !== undefined && (
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-card">
          {abgegeben ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-status-done" />
          ) : (
            <span className="block h-3.5 w-3.5 rounded-full border-2 border-card bg-status-progress" />
          )}
        </span>
      )}
    </span>
  );
}

/** Überlappende Avatare mit Abgabe-Haken — Teamgröße auf einen Blick. */
export function AvatarStack({
  personen,
  abgegebenIds,
  max = 5,
}: {
  personen: Mitarbeiter[];
  abgegebenIds?: string[];
  max?: number;
}) {
  const sichtbar = personen.slice(0, max);
  const rest = personen.length - sichtbar.length;
  return (
    <span className="flex items-center -space-x-1.5">
      {sichtbar.map((p) => (
        <Avatar
          key={p.id}
          person={p}
          abgegeben={abgegebenIds ? abgegebenIds.includes(p.id) : undefined}
        />
      ))}
      {rest > 0 && (
        <span className="relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-line text-xs font-medium text-ink-soft ring-2 ring-card">
          +{rest}
        </span>
      )}
    </span>
  );
}
