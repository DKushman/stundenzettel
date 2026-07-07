# Zeiterfassung — Mobile Stundenzettel-App mit A4-Blatt

Next.js (App Router) · TypeScript · Tailwind CSS · Framer Motion · react-hook-form + zod · react-signature-canvas.

Kernidee: Der Stundenzettel ist ein **festes A4-Blatt** (210 × 297 mm) mit immer gleicher Struktur. Die App setzt nur die Werte aus der Datenbank ein — pro Zeile: **Vorname · Nachname · Check-in · Check-out · Pause · Gearbeitete Zeit (berechnet) · Unterschrift**.

## Schnellstart

```bash
npm install
npm run dev        # http://localhost:3000
```

Deployment: Repo zu GitHub pushen → auf vercel.com importieren → fertig.

## Struktur

```
app/
  page.tsx                    Dashboard (Liste der A4-Blätter)
  erfassen/page.tsx           Eingabemaske (eine Zeile fürs Blatt)
  stundenzettel/[id]/page.tsx A4-Ansicht + Drucken/PDF
components/
  a4-sheet.tsx                Das feste A4-Blatt (druckfertig)
  app-shell.tsx               Sidebar mit animiertem Auf-/Zuklappen
  dashboard.tsx               Aktionskarten, Filter, Suche, Liste
  timesheet-form.tsx          Formular (react-hook-form + zod)
  signature-modal.tsx         Wiederverwendbares Signatur-Modal
  print-button.tsx            window.print() → Drucken / Als PDF speichern
  status-badge.tsx            Punkt-Badges (Offen/Eingereicht/Genehmigt)
  ui/                         Button, Input, Label, Textarea (shadcn-Stil)
lib/
  data.ts                     Typen (Sheet/Row) + Mock-Daten
  time.ts                     Check-in/-out/Pause → gearbeitete Zeit
  validations.ts              zod-Schema (exakt die DB-Spalten)
  actions.ts                  Server Action createTimesheetRow (DB-ready)
```

## A4 & Druck

Das Blatt ist in mm dimensioniert (`w-[210mm] min-h-[297mm]`, feste Zeilenhöhe `11mm`, 12 Zeilen pro Blatt — leere Zeilen bleiben sichtbar, damit die Struktur immer identisch ist). `@page { size: A4; margin: 0 }` plus `print:hidden` auf Sidebar/Toolbar sorgen dafür, dass beim Drucken (Strg/Cmd + P) exakt das Blatt auf der Seite landet — dort auch „Als PDF speichern" möglich.

## Vercel Postgres anbinden

1. Vercel-Dashboard → Projekt → **Storage** → **Create Database** → *Postgres (Neon)*. `POSTGRES_URL` wird automatisch gesetzt; lokal `vercel env pull .env.development.local`.
2. `npm i @vercel/postgres`
3. Zwei Tabellen anlegen — das SQL steht als Kommentar in `lib/actions.ts` (`timesheet_sheets` + `timesheet_rows` mit genau deinen Spalten).
4. In `lib/actions.ts` den auskommentierten `sql`-INSERT aktivieren.
5. Mock-Daten durch Queries ersetzen, z. B. in `app/stundenzettel/[id]/page.tsx`:

```ts
import { sql } from "@vercel/postgres";

const { rows } = await sql`
  SELECT vorname, nachname, datum, check_in, check_out, pause_min, signatur
  FROM timesheet_rows
  WHERE sheet_id = ${id}
  ORDER BY datum, nachname
`;
```

Signaturen: kommen als PNG-Data-URL aus dem Modal; fürs TEXT-Feld ok, bei Volumen besser **Vercel Blob** (`@vercel/blob`) und nur die URL speichern.
