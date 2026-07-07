import { statusAkzent, statusLabel, type SchichtStatus } from "@/lib/data";

const legendeReihenfolge: SchichtStatus[] = [
  "geplant",
  "offen",
  "teilweise",
  "ueberfaellig",
  "erfasst",
  "unterschrieben",
];

export function StatusLegende({ kompakt = false }: { kompakt?: boolean }) {
  return (
    <div
      className={
        kompakt
          ? "flex flex-wrap gap-x-3 gap-y-1.5"
          : "flex flex-wrap gap-x-4 gap-y-2 rounded-xl border border-line/80 bg-surface/50 px-3 py-2.5 sm:px-4"
      }
      aria-label="Farblegende Status"
    >
      {legendeReihenfolge.map((status) => (
        <span
          key={status}
          className="inline-flex items-center gap-1.5 text-[clamp(0.65rem,2.2vw,0.75rem)] text-ink-soft"
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full sm:h-2.5 sm:w-2.5"
            style={{ backgroundColor: statusAkzent[status] }}
          />
          {statusLabel[status]}
        </span>
      ))}
    </div>
  );
}
