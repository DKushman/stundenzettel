import { CloudOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-line bg-card p-8 text-center shadow-card">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-ink-soft">
        <CloudOff className="h-6 w-6" />
      </span>
      <h1 className="text-xl font-semibold">Keine Verbindung</h1>
      <p className="mt-2 text-[15px] text-ink-soft">
        Diese Seite ist offline nicht verfügbar. Bereits ausgefüllte Abgaben
        sind auf dem Gerät gespeichert und werden automatisch übertragen,
        sobald wieder Empfang besteht.
      </p>
    </div>
  );
}
