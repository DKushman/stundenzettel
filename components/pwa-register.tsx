"use client";

import { useEffect } from "react";
import { flushQueue } from "@/lib/offline";

/**
 * Registriert den Service Worker und reicht offline gespeicherte
 * Abgaben nach — beim App-Start und sobald die Verbindung zurückkommt.
 */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* Service Worker optional — z. B. im Dev-Modus nicht kritisch */
      });
    }

    void flushQueue();
    const onOnline = () => void flushQueue();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  return null;
}
