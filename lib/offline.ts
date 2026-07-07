/**
 * Offline-Queue (PWA): Abgaben werden bei fehlender Verbindung in
 * IndexedDB zwischengespeichert und automatisch nachgereicht, sobald
 * das Gerät wieder online ist (Listener in components/pwa-register.tsx).
 */

export type EintragPayload = {
  token: string;
  checkIn: string;
  checkOut: string;
  pauseMin: number;
  notiz: string;
  signatur: string;
  bestaetigt: true;
  richtigkeit: true;
  erfasstAmClient?: string;
};

const DB_NAME = "sz-offline";
const STORE = "abgabe-queue";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function queueHinzufuegen(payload: EintragPayload): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).add({ payload, queuedAt: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function queueLesen(): Promise<{ id: number; payload: EintragPayload }[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as { id: number; payload: EintragPayload }[]);
    req.onerror = () => reject(req.error);
  });
}

async function queueEntfernen(id: number): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function senden(payload: EintragPayload): Promise<Response> {
  return fetch("/api/eintrag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export type SubmitErgebnis =
  | { ok: true; offline: false; dokumentHash: string; erstelltAm: string; minuten: number }
  | { ok: true; offline: true }
  | { ok: false; error: string };

/** Abgabe senden — bei fehlender Verbindung automatisch in die Queue. */
export async function submitEintrag(payload: EintragPayload): Promise<SubmitErgebnis> {
  try {
    const res = await senden(payload);
    const json = (await res.json()) as {
      ok: boolean;
      error?: string;
      dokumentHash?: string;
      erstelltAm?: string;
      minuten?: number;
    };
    if (res.ok && json.ok) {
      return {
        ok: true,
        offline: false,
        dokumentHash: json.dokumentHash ?? "",
        erstelltAm: json.erstelltAm ?? new Date().toISOString(),
        minuten: json.minuten ?? 0,
      };
    }
    return { ok: false, error: json.error ?? "Unbekannter Fehler." };
  } catch {
    // Netzwerkfehler → offline zwischenspeichern
    await queueHinzufuegen({ ...payload, erfasstAmClient: new Date().toISOString() });
    return { ok: true, offline: true };
  }
}

/** Wartende Abgaben nachreichen. Wird bei App-Start + "online"-Event aufgerufen. */
export async function flushQueue(): Promise<{ gesendet: number; wartend: number }> {
  if (typeof indexedDB === "undefined") return { gesendet: 0, wartend: 0 };
  let gesendet = 0;
  let wartend = 0;
  try {
    const eintraege = await queueLesen();
    for (const { id, payload } of eintraege) {
      try {
        const res = await senden(payload);
        // Erfolg ODER fachlicher Fehler (z. B. bereits abgegeben) → aus der Queue nehmen.
        // Nur bei Netzwerk-/Serverfehlern (5xx) bleibt der Eintrag liegen.
        if (res.ok || (res.status >= 400 && res.status < 500)) {
          await queueEntfernen(id);
          if (res.ok) gesendet++;
        } else {
          wartend++;
        }
      } catch {
        wartend++;
      }
    }
  } catch {
    // IndexedDB nicht verfügbar — nichts zu tun
  }
  return { gesendet, wartend };
}
