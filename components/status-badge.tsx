import { cn } from "@/lib/utils";
import { statusLabel, type SchichtStatus } from "@/lib/data";

type Tone = "blau" | "orange" | "gruen" | "rot" | "grau" | "lila";

const tones: Record<Tone, { badge: string; dot: string }> = {
  blau: { badge: "bg-status-openBg text-status-open", dot: "bg-status-open" },
  orange: { badge: "bg-status-progressBg text-status-progress", dot: "bg-status-progress" },
  gruen: { badge: "bg-status-doneBg text-status-done", dot: "bg-status-done" },
  rot: { badge: "bg-red-50 text-red-600", dot: "bg-red-500" },
  grau: { badge: "bg-line/60 text-ink-soft", dot: "bg-ink-faint" },
  lila: { badge: "bg-status-teilweiseBg text-status-teilweise", dot: "bg-status-teilweise" },
};

export function Badge({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-[13px] font-medium",
        t.badge,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", t.dot)} />
      {children}
    </span>
  );
}

const statusTone: Record<SchichtStatus, Tone> = {
  geplant: "grau",
  offen: "orange",
  teilweise: "lila",
  ueberfaellig: "rot",
  erfasst: "blau",
  unterschrieben: "gruen",
};

export function StatusBadge({ status }: { status: SchichtStatus }) {
  return <Badge tone={statusTone[status]}>{statusLabel[status]}</Badge>;
}
