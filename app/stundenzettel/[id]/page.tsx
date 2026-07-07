import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { A4Blatt } from "@/components/a4-blatt";
import { Historie } from "@/components/historie";
import { PrintButton } from "@/components/print-button";
import { StatusBadge } from "@/components/status-badge";
import { CopyButton } from "@/components/copy-button";
import { getAuditFuerSchicht, getSchichtViewById } from "@/lib/queries";
import { formatDatumKurz } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function SheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [schicht, audit] = await Promise.all([
    getSchichtViewById(id),
    getAuditFuerSchicht(id),
  ]);
  if (!schicht) notFound();

  return (
    <div>
      {/* Toolbar — erscheint nicht im Druck */}
      <div className="mx-auto mb-6 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-card shadow-card transition-colors hover:bg-surface"
            aria-label="Zurück zur Übersicht"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="font-semibold leading-tight">{schicht.auftrag.titel}</p>
            <p className="text-sm text-ink-soft">
              {schicht.auftrag.auftraggeber} · {formatDatumKurz(schicht.datum)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={schicht.status} />
          {!schicht.kunde && (
            <>
              <CopyButton
                pfad={`/unterschrift/${schicht.kundenToken}`}
                label="Kunden-Link kopieren"
              />
              <Link
                href={`/unterschrift/${schicht.kundenToken}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-sm font-medium text-ink-soft shadow-card transition-colors hover:bg-surface hover:text-ink"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Öffnen
              </Link>
            </>
          )}
          <PrintButton />
        </div>
      </div>

      {/* Auf schmalen Displays horizontal scrollbar, das Blatt bleibt maßhaltig */}
      <div className="-mx-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:px-0 print:m-0 print:overflow-visible print:p-0">
        <A4Blatt schicht={schicht} modus="admin" />
      </div>

      <Historie eintraege={audit} />
    </div>
  );
}
