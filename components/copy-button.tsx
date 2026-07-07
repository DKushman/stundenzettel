"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

async function inZwischenablage(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback für ältere Browser / http
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

/** Kopiert einen App-Link (Origin + Pfad) in die Zwischenablage. */
export function CopyButton({
  pfad,
  label = "Link kopieren",
  kompakt,
  className,
}: {
  pfad: string;
  label?: string;
  kompakt?: boolean;
  className?: string;
}) {
  const [kopiert, setKopiert] = useState(false);

  const kopieren = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await inZwischenablage(`${window.location.origin}${pfad}`);
    if (ok) {
      setKopiert(true);
      setTimeout(() => setKopiert(false), 1800);
    }
  };

  return (
    <button
      type="button"
      onClick={kopieren}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-card font-medium text-ink-soft shadow-card transition-colors hover:bg-surface hover:text-ink",
        kompakt ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
        kopiert && "border-status-done/40 bg-status-doneBg text-status-done",
        className
      )}
      title="Link in die Zwischenablage kopieren"
    >
      {kopiert ? (
        <Check className={kompakt ? "h-3 w-3" : "h-3.5 w-3.5"} />
      ) : (
        <Copy className={kompakt ? "h-3 w-3" : "h-3.5 w-3.5"} />
      )}
      {kopiert ? "Kopiert!" : label}
    </button>
  );
}
