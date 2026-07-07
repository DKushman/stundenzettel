/** Zeit- und Datums-Helfer — app-weit genutzt. */

export function arbeitsMinuten(checkIn: string, checkOut: string, pauseMin: number) {
  const [ih, im] = checkIn.split(":").map(Number);
  const [oh, om] = checkOut.split(":").map(Number);
  return Math.max(0, oh * 60 + om - (ih * 60 + im) - pauseMin);
}

/** Minuten als "8:30" (Spalte "Gearbeitete Zeit"). */
export function minutenAlsZeit(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function isoHeute() {
  return new Date().toISOString().slice(0, 10);
}

/** ISO-Datum mit Offset in Tagen (für evergreen Demo-Daten). */
export function tagOffset(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function formatDatumKurz(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export function formatDatumLang(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("de-DE", {
    weekday: "short", day: "2-digit", month: "long",
  });
}

/** Montag der Woche eines Datums (ISO). */
export function wochenStart(d = new Date()) {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
}
