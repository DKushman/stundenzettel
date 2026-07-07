"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Asterisk, ChevronDown, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/copy-button";
import { eintragFeldSpeichern, type EditierbaresFeld } from "@/lib/actions";
import { statusLabel, type SchichtView, type ZuweisungView } from "@/lib/data";
import { arbeitsMinuten, minutenAlsZeit, formatDatumKurz } from "@/lib/time";

const ZEILEN_PRO_BLATT = 12;
const zelle = "border border-ink/70 px-2.5 py-0 align-middle";

/**
 * A4-Stundenzettel (210 × 297 mm).
 *
 * modus="admin":  alle Felder anklickbar (Inline-Bearbeitung mit Audit-Log),
 *                 Namens-Dropdown pro Zeile mit "Link kopieren" je Person.
 * modus="kunde":  reine Ansicht + Unterschrifts-Button im Fußbereich.
 * Beim Drucken (Strg/Cmd + P) füllt das Blatt die A4-Seite exakt aus.
 */
export function A4Blatt({
  schicht,
  modus,
  onKundeUnterschreiben,
}: {
  schicht: SchichtView;
  modus: "admin" | "kunde";
  onKundeUnterschreiben?: () => void;
}) {
  const [fehler, setFehler] = useState<string | null>(null);
  const leereZeilen = Math.max(0, ZEILEN_PRO_BLATT - schicht.zuweisungen.length);

  const gesamtMinuten = schicht.zuweisungen.reduce(
    (sum, z) =>
      sum + (z.eintrag ? arbeitsMinuten(z.eintrag.checkIn, z.eintrag.checkOut, z.eintrag.pauseMin) : 0),
    0
  );

  const notizen = schicht.zuweisungen.filter((z) => z.eintrag?.notiz);

  return (
    <div>
      {fehler && (
        <p className="mx-auto mb-3 w-[210mm] max-w-full rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 print:hidden">
          {fehler}
        </p>
      )}

      <div
        className="mx-auto min-h-[297mm] w-[210mm] shrink-0 border border-line bg-white p-[14mm] text-ink shadow-card print:m-0 print:border-0 print:shadow-none"
        style={{ fontSize: "10.5pt", lineHeight: 1.35 }}
      >
        {/* ── Briefkopf ─────────────────────────────────────────────── */}
        <header className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white">
              <Asterisk className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-semibold leading-tight tracking-tight">Zeiterfassung</p>
              <p className="text-[9pt] text-ink-soft">Muster GmbH · Beispielweg 1 · 12345 Stadt</p>
            </div>
          </div>
          <div className="text-right text-[9pt] text-ink-soft">
            <p>Beleg-Nr.: {schicht.id}</p>
            <p>Status: {statusLabel[schicht.status]}</p>
          </div>
        </header>

        <h1 className="mt-8 text-[20pt] font-semibold tracking-tight">Stundenzettel</h1>

        <div className="mt-4 grid grid-cols-3 gap-x-6 text-[10pt]">
          <p className="border-b border-ink/50 pb-1">
            <span className="text-ink-soft">Auftraggeber: </span>
            <span className="font-medium">{schicht.auftrag.auftraggeber}</span>
          </p>
          <p className="border-b border-ink/50 pb-1">
            <span className="text-ink-soft">Projekt / Einsatzort: </span>
            <span className="font-medium">
              {schicht.auftrag.titel} · {schicht.auftrag.ort}
            </span>
          </p>
          <p className="border-b border-ink/50 pb-1">
            <span className="text-ink-soft">Datum: </span>
            <span className="font-medium">{formatDatumKurz(schicht.datum)}</span>
          </p>
        </div>

        {/* ── Tabelle ───────────────────────────────────────────────── */}
        <table className="mt-6 w-full border-collapse text-[9.5pt]">
          <thead>
            <tr className="bg-surface text-left">
              <th className={`${zelle} w-[7mm] py-1.5 text-center font-medium`}>Nr.</th>
              <th className={`${zelle} py-1.5 font-medium`}>Name</th>
              <th className={`${zelle} w-[17mm] py-1.5 text-center font-medium`}>Check-in</th>
              <th className={`${zelle} w-[17mm] py-1.5 text-center font-medium`}>Check-out</th>
              <th className={`${zelle} w-[14mm] py-1.5 text-center font-medium`}>Pause</th>
              <th className={`${zelle} w-[19mm] py-1.5 text-center font-medium`}>Gearb. Zeit</th>
              <th className={`${zelle} w-[34mm] py-1.5 text-center font-medium`}>
                Unterschrift Mitarbeiter
              </th>
            </tr>
          </thead>
          <tbody>
            {schicht.zuweisungen.map((z, i) => (
              <Zeile
                key={z.mitarbeiter.id}
                index={i}
                zuweisung={z}
                schicht={schicht}
                editierbar={modus === "admin"}
                onFehler={setFehler}
              />
            ))}

            {Array.from({ length: leereZeilen }).map((_, i) => (
              <tr key={`leer-${i}`} className="h-[11mm]">
                <td className={`${zelle} text-center text-ink-faint`}>
                  {schicht.zuweisungen.length + i + 1}
                </td>
                {Array.from({ length: 6 }).map((__, j) => (
                  <td key={j} className={zelle} />
                ))}
              </tr>
            ))}

            <tr className="h-[11mm] bg-surface">
              <td className={`${zelle} border-b-0 border-l-0 bg-white`} colSpan={4} />
              <td className={`${zelle} text-right font-medium`}>Gesamt</td>
              <td className={`${zelle} text-center font-semibold tabular-nums`}>
                {minutenAlsZeit(gesamtMinuten)} h
              </td>
              <td className={zelle} />
            </tr>
          </tbody>
        </table>

        {notizen.length > 0 && (
          <div className="mt-4 text-[9pt] text-ink-soft">
            <p className="font-medium text-ink">Notizen</p>
            {notizen.map((z) => (
              <p key={z.mitarbeiter.id}>
                {z.mitarbeiter.vorname} {z.mitarbeiter.nachname}: {z.eintrag?.notiz}
              </p>
            ))}
          </div>
        )}

        {/* ── Fußbereich: Kunden-Unterschrift ───────────────────────── */}
        <div className="mt-[18mm] grid grid-cols-2 gap-x-[24mm] text-[9pt] text-ink-soft">
          <div className="flex flex-col justify-end">
            <p className="min-h-[10mm] font-medium text-ink">
              {schicht.kunde
                ? `${schicht.auftrag.ort}, ${new Date(schicht.kunde.unterschriebenAm).toLocaleDateString("de-DE")}`
                : ""}
            </p>
            <div className="border-b border-ink/70" />
            <p className="mt-1.5">Ort, Datum</p>
          </div>
          <div className="flex flex-col justify-end">
            {schicht.kunde ? (
              <div className="flex min-h-[10mm] items-end gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={schicht.kunde.signatur}
                  alt={`Unterschrift ${schicht.kunde.name}`}
                  className="h-[12mm] w-auto max-w-[50mm] object-contain"
                />
                <span className="pb-0.5 font-medium text-ink">{schicht.kunde.name}</span>
              </div>
            ) : modus === "kunde" && onKundeUnterschreiben ? (
              <button
                type="button"
                onClick={onKundeUnterschreiben}
                className="mb-1 flex min-h-[12mm] items-center justify-center gap-2 rounded-lg border border-dashed border-ink-faint/60 bg-surface text-[10pt] font-medium text-ink transition-colors hover:bg-line/50 print:hidden"
              >
                <PenLine className="h-4 w-4" /> Hier unterschreiben
              </button>
            ) : (
              <div className="min-h-[10mm]" />
            )}
            <div className="border-b border-ink/70" />
            <p className="mt-1.5">Unterschrift Auftraggeber / Einsatzleitung</p>
          </div>
        </div>

        <p className="mt-[8mm] text-[8pt] text-ink-faint">
          Gearbeitete Zeit = Check-out − Check-in − Pause. Jede Änderung wird revisionssicher
          protokolliert (Audit-Log).
          {schicht.kunde?.dokumentHash && (
            <> Prüf-Hash Kundenfreigabe: {schicht.kunde.dokumentHash.slice(0, 24)}…</>
          )}
        </p>
      </div>
    </div>
  );
}

/* ── Eine Tabellenzeile (Person) ─────────────────────────────────── */

function Zeile({
  index,
  zuweisung,
  schicht,
  editierbar,
  onFehler,
}: {
  index: number;
  zuweisung: ZuweisungView;
  schicht: SchichtView;
  editierbar: boolean;
  onFehler: (f: string | null) => void;
}) {
  const { mitarbeiter, eintrag } = zuweisung;
  const minuten = eintrag
    ? arbeitsMinuten(eintrag.checkIn, eintrag.checkOut, eintrag.pauseMin)
    : null;

  return (
    <tr className="h-[11mm]">
      <td className={`${zelle} text-center text-ink-soft`}>{index + 1}</td>
      <td className={`${zelle} relative`}>
        {editierbar ? (
          <NamenDropdown zuweisung={zuweisung} alle={schicht.zuweisungen} />
        ) : (
          <span className="font-medium">
            {mitarbeiter.vorname} {mitarbeiter.nachname}
          </span>
        )}
      </td>
      <FeldZelle
        editierbar={editierbar}
        typ="time"
        wert={eintrag?.checkIn ?? ""}
        feld="checkIn"
        schichtId={schicht.id}
        mitarbeiterId={mitarbeiter.id}
        onFehler={onFehler}
      />
      <FeldZelle
        editierbar={editierbar}
        typ="time"
        wert={eintrag?.checkOut ?? ""}
        feld="checkOut"
        schichtId={schicht.id}
        mitarbeiterId={mitarbeiter.id}
        onFehler={onFehler}
      />
      <FeldZelle
        editierbar={editierbar}
        typ="number"
        wert={eintrag ? String(eintrag.pauseMin) : ""}
        einheit=" min"
        feld="pauseMin"
        schichtId={schicht.id}
        mitarbeiterId={mitarbeiter.id}
        onFehler={onFehler}
      />
      <td className={`${zelle} text-center font-medium tabular-nums`}>
        {minuten != null ? `${minutenAlsZeit(minuten)} h` : ""}
      </td>
      <td className={`${zelle} text-center`}>
        {eintrag?.signatur ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={eintrag.signatur}
            alt={`Unterschrift ${mitarbeiter.vorname} ${mitarbeiter.nachname}`}
            className="mx-auto h-[8mm] w-auto max-w-[30mm] object-contain"
          />
        ) : eintrag ? (
          <span className="text-[8pt] text-ink-faint">erfasst durch Disposition</span>
        ) : (
          <span className="text-[8pt] text-ink-faint print:hidden">ausstehend</span>
        )}
      </td>
    </tr>
  );
}

/* ── Namens-Dropdown: eingeteilte Personen + Link kopieren ────────── */

function NamenDropdown({
  zuweisung,
  alle,
}: {
  zuweisung: ZuweisungView;
  alle: ZuweisungView[];
}) {
  const [offen, setOffen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!offen) return;
    const schliessen = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOffen(false);
    };
    document.addEventListener("mousedown", schliessen);
    return () => document.removeEventListener("mousedown", schliessen);
  }, [offen]);

  return (
    <div ref={ref}>
      <button
        type="button"
        onClick={() => setOffen((o) => !o)}
        className="flex w-full items-center justify-between gap-1 rounded px-1 py-0.5 text-left font-medium transition-colors hover:bg-surface"
        title="Eingeteilte Personen anzeigen — Link je Person kopieren"
      >
        <span className="truncate">
          {zuweisung.mitarbeiter.vorname} {zuweisung.mitarbeiter.nachname}
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 text-ink-faint transition-transform print:hidden", offen && "rotate-180")}
        />
      </button>

      {offen && (
        <div className="absolute left-0 top-full z-30 mt-1 w-[72mm] rounded-xl border border-line bg-card p-1.5 shadow-sheet print:hidden">
          <p className="px-2 pb-1 pt-0.5 text-[8pt] font-medium uppercase tracking-wide text-ink-faint">
            Für diese Schicht eingeteilt
          </p>
          <ul className="space-y-0.5">
            {alle.map((z) => (
              <li
                key={z.mitarbeiter.id}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-surface"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: z.mitarbeiter.farbe }}
                  />
                  <span
                    className={cn(
                      "truncate text-[9.5pt]",
                      z.mitarbeiter.id === zuweisung.mitarbeiter.id && "font-semibold"
                    )}
                  >
                    {z.mitarbeiter.vorname} {z.mitarbeiter.nachname}
                  </span>
                  {z.eintrag && <span className="text-[8pt] text-status-done">✓ abgegeben</span>}
                </span>
                <CopyButton pfad={`/erfassen/${z.token}`} label="Kopieren" kompakt />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── Anklickbare Feld-Zelle mit Inline-Bearbeitung ───────────────── */

function FeldZelle({
  editierbar,
  typ,
  wert,
  einheit = "",
  feld,
  schichtId,
  mitarbeiterId,
  onFehler,
}: {
  editierbar: boolean;
  typ: "time" | "number";
  wert: string;
  einheit?: string;
  feld: EditierbaresFeld;
  schichtId: string;
  mitarbeiterId: string;
  onFehler: (f: string | null) => void;
}) {
  const router = useRouter();
  const [bearbeitet, setBearbeitet] = useState(false);
  const [entwurf, setEntwurf] = useState(wert);
  const [pending, startTransition] = useTransition();

  useEffect(() => setEntwurf(wert), [wert]);

  const speichern = () => {
    setBearbeitet(false);
    if (entwurf === wert || entwurf === "") {
      setEntwurf(wert);
      return;
    }
    onFehler(null);
    startTransition(async () => {
      const res = await eintragFeldSpeichern({ schichtId, mitarbeiterId, feld, wert: entwurf });
      if (!res.ok) {
        onFehler(res.error);
        setEntwurf(wert);
      } else {
        router.refresh();
      }
    });
  };

  if (!editierbar) {
    return (
      <td className={`${zelle} text-center tabular-nums`}>
        {wert ? `${wert}${einheit}` : ""}
      </td>
    );
  }

  return (
    <td className={`${zelle} text-center tabular-nums`}>
      {bearbeitet ? (
        <input
          autoFocus
          type={typ}
          inputMode={typ === "number" ? "numeric" : undefined}
          min={typ === "number" ? 0 : undefined}
          max={typ === "number" ? 480 : undefined}
          step={typ === "number" ? 5 : undefined}
          value={entwurf}
          onChange={(e) => setEntwurf(e.target.value)}
          onBlur={speichern}
          onKeyDown={(e) => {
            if (e.key === "Enter") speichern();
            if (e.key === "Escape") {
              setEntwurf(wert);
              setBearbeitet(false);
            }
          }}
          className="w-full rounded border border-ink/40 bg-surface px-1 py-0.5 text-center text-[9.5pt] tabular-nums focus:outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setBearbeitet(true)}
          disabled={pending}
          className={cn(
            "w-full rounded px-1 py-0.5 transition-colors hover:bg-status-openBg/70",
            pending && "opacity-50",
            !wert && "text-ink-faint"
          )}
          title="Klicken zum Bearbeiten (wird im Audit-Log protokolliert)"
        >
          {pending ? "…" : wert ? `${wert}${einheit}` : "—"}
        </button>
      )}
    </td>
  );
}
