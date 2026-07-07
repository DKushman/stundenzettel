"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Öffnet den System-Druckdialog — dort auch "Als PDF speichern" möglich. */
export function PrintButton() {
  return (
    <Button onClick={() => window.print()}>
      <Printer className="h-4 w-4" /> Drucken / PDF
    </Button>
  );
}
