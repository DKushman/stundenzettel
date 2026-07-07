"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAppData } from "@/lib/app-data-store";

/**
 * Lädt Dashboard-Daten einmal in den Client-Store.
 * Sidebar und Liste filtern danach rein clientseitig — kein Server-Roundtrip.
 */
export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fetchDashboard = useAppData((s) => s.fetchDashboard);
  const loaded = useAppData((s) => s.loaded);
  const prevPath = useRef(pathname);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const prev = prevPath.current;
    prevPath.current = pathname;

    if (pathname === "/" && prev.startsWith("/stundenzettel/") && loaded) {
      fetchDashboard({ background: true, force: true });
    }
  }, [pathname, loaded, fetchDashboard]);

  return children;
}
