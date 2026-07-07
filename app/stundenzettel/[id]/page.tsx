import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { A4Sheet } from "@/components/a4-sheet";
import { PrintButton } from "@/components/print-button";
import { StatusBadge } from "@/components/status-badge";
import { sheets } from "@/lib/data";

/**
 * Detailansicht: das feste A4-Blatt, befüllt mit den Werten aus der DB.
 *
 * Nach der Postgres-Anbindung ersetzt du den Mock-Zugriff durch:
 *
 *   import { sql } from "@vercel/postgres";
 *   const { rows } = await sql`
 *     SELECT vorname, nachname, datum, check_in, check_out, pause_min, signatur
 *     FROM timesheet_rows
 *     WHERE sheet_id = ${params.id}
 *     ORDER BY datum, nachname
 *   `;
 */
export default async function SheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sheet = sheets.find((s) => s.id === id);
  if (!sheet) notFound();

  return (
    <div>
      {/* Toolbar — erscheint nicht im Druck */}
      <div className="mx-auto mb-6 flex max-w-[210mm] items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-card shadow-card transition-colors hover:bg-surface"
            aria-label="Zurück zur Übersicht"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="font-semibold leading-tight">{sheet.projekt}</p>
            <p className="text-sm text-ink-soft">{sheet.zeitraum}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block"><StatusBadge status={sheet.status} /></span>
          <PrintButton />
        </div>
      </div>

      {/* Auf schmalen Displays horizontal scrollbar, das Blatt bleibt maßhaltig */}
      <div className="-mx-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:px-0 print:m-0 print:overflow-visible print:p-0">
        <A4Sheet sheet={sheet} />
      </div>
    </div>
  );
}
