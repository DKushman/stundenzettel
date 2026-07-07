import { Asterisk } from "lucide-react";
import type { TimesheetSheet } from "@/lib/data";
import { sheetMinuten } from "@/lib/data";
import { arbeitsMinuten, minutenAlsZeit } from "@/lib/time";
import { statusLabelSheet } from "@/lib/data";

/** Das Blatt hat immer dieselbe Struktur: feste Zeilenzahl, leere Zeilen bleiben leer. */
const ZEILEN_PRO_BLATT = 12;

function formatDatum(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * A4-Stundenzettel (210 × 297 mm).
 *
 * Reine Vorlage — sie rendert ausschließlich die Werte aus der
 * Datenbank in die feste Tabellenstruktur:
 * Vorname · Nachname · Check-in · Check-out · Pause · Gearbeitete Zeit · Unterschrift.
 *
 * Auf dem Bildschirm liegt das Blatt als Karte auf der grauen Fläche,
 * beim Drucken (Strg/Cmd + P) füllt es die A4-Seite exakt aus.
 */
export function A4Sheet({ sheet }: { sheet: TimesheetSheet }) {
  const leereZeilen = Math.max(0, ZEILEN_PRO_BLATT - sheet.rows.length);
  const gesamtMinuten = sheetMinuten(sheet);

  const zelle = "border border-ink/70 px-2.5 py-0 align-middle";

  return (
    <div
      className="mx-auto w-[210mm] min-h-[297mm] shrink-0 bg-white p-[14mm] text-ink shadow-card border border-line print:m-0 print:border-0 print:shadow-none"
      style={{ fontSize: "10.5pt", lineHeight: 1.35 }}
    >
      {/* ── Briefkopf ─────────────────────────────────────────────── */}
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white">
            <Asterisk className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-semibold leading-tight tracking-tight">
              Zeiterfassung
            </p>
            <p className="text-[9pt] text-ink-soft">Muster GmbH · Beispielweg 1 · 12345 Stadt</p>
          </div>
        </div>
        <div className="text-right text-[9pt] text-ink-soft">
          <p>Beleg-Nr.: {sheet.id}</p>
          <p>Status: {statusLabelSheet[sheet.status]}</p>
        </div>
      </header>

      <h1 className="mt-8 text-[20pt] font-semibold tracking-tight">Stundenzettel</h1>

      {/* Meta-Zeile: Projekt + Zeitraum */}
      <div className="mt-4 grid grid-cols-2 gap-x-8 text-[10pt]">
        <p className="border-b border-ink/50 pb-1">
          <span className="text-ink-soft">Projekt / Baustelle: </span>
          <span className="font-medium">{sheet.projekt}</span>
        </p>
        <p className="border-b border-ink/50 pb-1">
          <span className="text-ink-soft">Zeitraum: </span>
          <span className="font-medium">{sheet.zeitraum}</span>
        </p>
      </div>

      {/* ── Feste Tabelle ─────────────────────────────────────────── */}
      <table className="mt-6 w-full border-collapse text-[9.5pt]">
        <thead>
          <tr className="bg-surface text-left">
            <th className={`${zelle} w-[7mm] py-1.5 text-center font-medium`}>Nr.</th>
            <th className={`${zelle} py-1.5 font-medium`}>Vorname</th>
            <th className={`${zelle} py-1.5 font-medium`}>Nachname</th>
            <th className={`${zelle} w-[19mm] py-1.5 text-center font-medium`}>Datum</th>
            <th className={`${zelle} w-[16mm] py-1.5 text-center font-medium`}>Check-in</th>
            <th className={`${zelle} w-[16mm] py-1.5 text-center font-medium`}>Check-out</th>
            <th className={`${zelle} w-[13mm] py-1.5 text-center font-medium`}>Pause</th>
            <th className={`${zelle} w-[19mm] py-1.5 text-center font-medium`}>Gearb. Zeit</th>
            <th className={`${zelle} w-[32mm] py-1.5 text-center font-medium`}>Unterschrift</th>
          </tr>
        </thead>
        <tbody>
          {sheet.rows.map((r, i) => (
            <tr key={r.id} className="h-[11mm]">
              <td className={`${zelle} text-center text-ink-soft`}>{i + 1}</td>
              <td className={zelle}>{r.vorname}</td>
              <td className={zelle}>{r.nachname}</td>
              <td className={`${zelle} text-center tabular-nums`}>{formatDatum(r.datum)}</td>
              <td className={`${zelle} text-center tabular-nums`}>{r.checkIn}</td>
              <td className={`${zelle} text-center tabular-nums`}>{r.checkOut}</td>
              <td className={`${zelle} text-center tabular-nums`}>{r.pauseMin} min</td>
              <td className={`${zelle} text-center font-medium tabular-nums`}>
                {minutenAlsZeit(arbeitsMinuten(r.checkIn, r.checkOut, r.pauseMin))} h
              </td>
              <td className={`${zelle} text-center`}>
                {r.signatur ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.signatur}
                    alt={`Unterschrift ${r.vorname} ${r.nachname}`}
                    className="mx-auto h-[8mm] w-auto max-w-[30mm] object-contain"
                  />
                ) : null}
              </td>
            </tr>
          ))}

          {/* Leere Zeilen — das Blatt behält immer dieselbe Struktur */}
          {Array.from({ length: leereZeilen }).map((_, i) => (
            <tr key={`leer-${i}`} className="h-[11mm]">
              <td className={`${zelle} text-center text-ink-faint`}>
                {sheet.rows.length + i + 1}
              </td>
              {Array.from({ length: 8 }).map((__, j) => (
                <td key={j} className={zelle} />
              ))}
            </tr>
          ))}

          {/* Summenzeile */}
          <tr className="h-[11mm] bg-surface">
            <td className={`${zelle} border-l-0 border-b-0 bg-white`} colSpan={6} />
            <td className={`${zelle} text-right font-medium`}>Gesamt</td>
            <td className={`${zelle} text-center font-semibold tabular-nums`}>
              {minutenAlsZeit(gesamtMinuten)} h
            </td>
            <td className={zelle} />
          </tr>
        </tbody>
      </table>

      {/* ── Fußbereich mit Unterschriftslinien ────────────────────── */}
      <div className="mt-[22mm] grid grid-cols-2 gap-x-[24mm] text-[9pt] text-ink-soft">
        <div>
          <div className="border-b border-ink/70" />
          <p className="mt-1.5">Ort, Datum</p>
        </div>
        <div>
          <div className="border-b border-ink/70" />
          <p className="mt-1.5">Unterschrift Bauleitung / Auftraggeber</p>
        </div>
      </div>

      <p className="mt-[10mm] text-[8pt] text-ink-faint">
        Gearbeitete Zeit = Check-out − Check-in − Pause. Erstellt mit der digitalen
        Zeiterfassung · {new Date().toLocaleDateString("de-DE")}
      </p>
    </div>
  );
}
