"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SignatureCanvas from "react-signature-canvas";
import { Eraser, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type SignatureModalProps = {
  open: boolean;
  onClose: () => void;
  /** Liefert die Unterschrift als PNG-Data-URL zurück. */
  onConfirm: (dataUrl: string) => void;
  titel?: string;
  hinweis?: string;
};

/**
 * Wiederverwendbares Signatur-Modal.
 *
 * Mobil: Full-Screen-Sheet, das von unten einfährt (Framer Motion).
 * Desktop: zentrierter Dialog. Canvas skaliert per ResizeObserver
 * mit devicePixelRatio für scharfe Striche auf Retina-Displays.
 */
export function SignatureModal({
  open,
  onClose,
  onConfirm,
  titel = "Unterschrift",
  hinweis = "Bitte im Feld unten mit dem Finger oder Stift unterschreiben.",
}: SignatureModalProps) {
  const padRef = useRef<SignatureCanvas>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [leer, setLeer] = useState(true);

  // Canvas an Containergröße + Pixeldichte anpassen
  useEffect(() => {
    if (!open) return;
    const box = boxRef.current;
    const canvas = padRef.current?.getCanvas();
    if (!box || !canvas) return;

    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = box.offsetWidth * ratio;
      canvas.height = box.offsetHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      padRef.current?.clear();
      setLeer(true);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(box);
    return () => observer.disconnect();
  }, [open]);

  // Hintergrund-Scroll sperren, solange das Modal offen ist
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const loeschen = () => {
    padRef.current?.clear();
    setLeer(true);
  };

  const bestaetigen = () => {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) return;
    onConfirm(pad.getTrimmedCanvas().toDataURL("image/png"));
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-[2px] sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={titel}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[92dvh] w-full flex-col rounded-t-2xl bg-card shadow-sheet sm:h-auto sm:max-w-lg sm:rounded-2xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
          >
            {/* Griff-Indikator (mobil) */}
            <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-line sm:hidden" />

            <header className="flex items-center justify-between px-5 pb-2 pt-4 sm:pt-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">{titel}</h2>
                <p className="mt-0.5 text-sm text-ink-soft">{hinweis}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Schließen">
                <X className="h-5 w-5" />
              </Button>
            </header>

            {/* Zeichenfläche */}
            <div className="flex-1 px-5 py-3 sm:flex-none">
              <div
                ref={boxRef}
                className="relative h-full min-h-[260px] overflow-hidden rounded-xl border border-dashed border-ink-faint/50 bg-surface sm:h-[280px]"
              >
                <SignatureCanvas
                  ref={padRef}
                  penColor="#101113"
                  minWidth={1.2}
                  maxWidth={2.6}
                  onBegin={() => setLeer(false)}
                  canvasProps={{
                    className: "h-full w-full touch-none",
                    "aria-label": "Unterschriftenfeld",
                  }}
                />
                {/* Grundlinie wie auf Papier */}
                <div className="pointer-events-none absolute inset-x-8 bottom-12 border-b border-ink-faint/40" />
                {leer && (
                  <span className="pointer-events-none absolute inset-x-0 bottom-14 text-center text-sm text-ink-faint">
                    Hier unterschreiben
                  </span>
                )}
              </div>
            </div>

            {/* Aktionen — daumenfreundlich am unteren Rand */}
            <footer className="flex gap-3 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
              <Button variant="secondary" className="shrink-0" onClick={loeschen}>
                <Eraser className="h-4 w-4" /> Löschen
              </Button>
              <Button className="flex-1" size="lg" disabled={leer} onClick={bestaetigen}>
                Unterschrift übernehmen
              </Button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
