# Zeiterfassung — Stundenzettel für Personalvermittlung

Next.js (App Router) · TypeScript · Tailwind · Postgres (Neon/Vercel) · PWA.

Der Stundenzettel ist ein festes A4-Blatt pro Schicht. Die eingeteilten
Mitarbeiter stehen immer schon mit Namen in der Tabelle — erfasst werden nur
Zeiten und Unterschriften.

## Funktionen

- **Dashboard nach Datum**: Alle Stundenzettel chronologisch gruppiert, mit Status
  (Geplant / Offen / Teilweise / Überfällig / Erfasst / Unterschrieben) und Abgabe-Fortschritt.
- **Interaktives A4-Blatt**: Alle Felder anklickbar (Inline-Bearbeitung durch die
  Disposition). Namens-Dropdown pro Zeile zeigt die eingeteilten Personen — daneben
  „Kopieren“ für den persönlichen Questionnaire-Link genau dieser Schicht.
- **Mitarbeiter-Questionnaire** (`/erfassen/<token>`): mobiler 4-Schritte-Wizard ohne
  Login, große Touch-Ziele, numerische Tastatur, digitale Unterschrift.
- **Kunden-Unterschrift** (`/unterschrift/<token>`): Der Auftraggeber sieht das A4-Blatt
  und zeichnet digital gegen. Link über „Kunden-Link kopieren“ auf dem Blatt.
- **Revisionssicherheit**: Audit-Log für jede Änderung (wer, wann, was, alt → neu, IP,
  Gerät) + SHA-256-Prüf-Hash, der Unterschriften kryptografisch an die Felder bindet.
  Änderungshistorie unter jedem A4-Blatt einsehbar.
- **Automatische Erinnerungen**: Stündlicher Vercel-Cron (`/api/cron/erinnerungen`)
  findet Abgaben, die 24 h nach Schichtende fehlen. Fällige Erinnerungen erscheinen
  oben im Dashboard mit Kopier-Link; E-Mail-Versand (z. B. Resend) ist in der
  Cron-Route vorbereitet.
- **PWA + Offline**: Installierbar (manifest + Service Worker). Abgaben ohne Empfang
  landen in einer IndexedDB-Queue und werden automatisch nachgereicht.

## Schnellstart (lokal, ohne Setup)

```bash
npm install
npm run dev        # http://localhost:3000
```

Ohne `DATABASE_URL` läuft automatisch **PGlite** — ein eingebettetes Postgres, das
unter `.data/` im Projektordner persistiert. Beim ersten Start werden Schema und
Demo-Daten angelegt. `npm run db:reset` setzt die lokale Datenbank zurück.

## Vercel + Neon Postgres

1. Repo zu GitHub pushen → auf vercel.com importieren.
2. Vercel-Dashboard → Projekt → **Storage** → **Create Database** → *Neon Postgres*.
   `DATABASE_URL` wird automatisch gesetzt.
3. Environment Variables ergänzen:
   - `TOKEN_SECRET` — langer Zufallswert; signiert die Mitarbeiter-/Kunden-Links.
   - `CRON_SECRET` *(optional)* — schützt die Cron-Route.
4. Deploy. Schema + Demo-Daten werden beim ersten Zugriff automatisch angelegt.

Lokal gegen Neon testen: `vercel env pull .env.development.local`.

## Wichtige Pfade

```
app/page.tsx                      Dashboard (nach Datum gruppiert)
app/stundenzettel/[id]/           Interaktives A4-Blatt + Änderungshistorie
app/erfassen/[token]/             Mitarbeiter-Questionnaire (signierter Link)
app/unterschrift/[token]/         Kunden-Gegenzeichnung (signierter Link)
app/api/eintrag/                  Abgabe-Endpoint (auch für Offline-Sync)
app/api/cron/erinnerungen/        24h-Erinnerungslogik (Vercel Cron, s. vercel.json)
lib/db.ts                         Neon (pg) ↔ PGlite-Fallback, Auto-Migration + Seed
lib/schema.ts · lib/seed.ts       Tabellen + Demo-Daten
lib/queries.ts · lib/actions.ts   Datenzugriff + Server Actions (mit Audit-Log)
lib/invite-token.ts               Signierte HMAC-Links (zustandslos)
lib/audit.ts                      Audit-Log + SHA-256-Hashing
lib/offline.ts · public/sw.js     Offline-Queue (IndexedDB) + Service Worker
```

## Hinweise

- **Login**: Das Dashboard ist bewusst noch offen (Testphase). Vor dem echten
  Einsatz einen Schutz ergänzen (z. B. Passwort/Basic Auth via Middleware) —
  die Token-Links für Mitarbeiter/Kunden funktionieren unabhängig davon.
- **Audit-Akteur**: Ohne Login werden Dashboard-Änderungen als „Disposition“
  protokolliert. Mit Login kann hier der echte Benutzername stehen.
- **Druck/PDF**: Strg/Cmd + P auf dem A4-Blatt — dort auch „Als PDF speichern“.
