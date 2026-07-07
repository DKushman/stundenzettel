/**
 * Postgres-Schema — läuft identisch auf Neon (Vercel) und dem lokalen
 * PGlite-Fallback. Alle Zeitstempel werden als ISO-Text gespeichert,
 * damit sich beide Treiber exakt gleich verhalten.
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS mitarbeiter (
  id        TEXT PRIMARY KEY,
  vorname   TEXT NOT NULL,
  nachname  TEXT NOT NULL,
  rolle     TEXT NOT NULL DEFAULT 'Mitarbeiter',
  farbe     TEXT NOT NULL DEFAULT '#3B82F6',
  email     TEXT,
  telefon   TEXT
);

CREATE TABLE IF NOT EXISTS auftraege (
  id              TEXT PRIMARY KEY,
  titel           TEXT NOT NULL,
  auftraggeber    TEXT NOT NULL,
  ansprechpartner TEXT,
  email           TEXT,
  ort             TEXT NOT NULL DEFAULT '',
  farbe           TEXT NOT NULL DEFAULT '#3B82F6'
);

CREATE TABLE IF NOT EXISTS schichten (
  id                      TEXT PRIMARY KEY,
  auftrag_id              TEXT NOT NULL REFERENCES auftraege(id),
  datum                   TEXT NOT NULL,            -- ISO 'YYYY-MM-DD'
  beginn_geplant          TEXT NOT NULL,            -- 'HH:MM'
  ende_geplant            TEXT NOT NULL,
  kunde_name              TEXT,
  kunde_signatur          TEXT,                     -- PNG-Data-URL
  kunde_unterschrieben_am TEXT,
  kunde_dokument_hash     TEXT
);
CREATE INDEX IF NOT EXISTS idx_schichten_datum ON schichten(datum);

CREATE TABLE IF NOT EXISTS schicht_mitarbeiter (
  schicht_id     TEXT NOT NULL REFERENCES schichten(id) ON DELETE CASCADE,
  mitarbeiter_id TEXT NOT NULL REFERENCES mitarbeiter(id),
  PRIMARY KEY (schicht_id, mitarbeiter_id)
);

CREATE TABLE IF NOT EXISTS eintraege (
  id             TEXT PRIMARY KEY,
  schicht_id     TEXT NOT NULL REFERENCES schichten(id) ON DELETE CASCADE,
  mitarbeiter_id TEXT NOT NULL REFERENCES mitarbeiter(id),
  check_in       TEXT NOT NULL,
  check_out      TEXT NOT NULL,
  pause_min      INTEGER NOT NULL DEFAULT 0,
  notiz          TEXT,
  signatur       TEXT,                              -- NULL, wenn von der Disposition erfasst
  quelle         TEXT NOT NULL DEFAULT 'mitarbeiter', -- 'mitarbeiter' | 'disposition'
  dokument_hash  TEXT,                              -- SHA-256 über Felder + Signatur
  session_id     TEXT,
  user_agent     TEXT,
  ip             TEXT,
  erstellt_am    TEXT NOT NULL,
  geaendert_am   TEXT,
  UNIQUE (schicht_id, mitarbeiter_id)               -- Doppel-Abgabe-Schutz auf DB-Ebene
);

-- Revisionssicherheit: jede Änderung wird protokolliert (wer, wann, was, alt → neu)
CREATE TABLE IF NOT EXISTS audit_log (
  id            TEXT PRIMARY KEY,
  entitaet      TEXT NOT NULL,                      -- 'eintrag' | 'schicht'
  entitaet_id   TEXT NOT NULL,
  schicht_id    TEXT,
  aktion        TEXT NOT NULL,                      -- 'erstellt' | 'geaendert' | 'kunde_unterschrieben' | ...
  feld          TEXT,
  alt_wert      TEXT,
  neu_wert      TEXT,
  akteur        TEXT NOT NULL,
  akteur_typ    TEXT NOT NULL,                      -- 'mitarbeiter' | 'kunde' | 'disposition' | 'system'
  user_agent    TEXT,
  ip            TEXT,
  dokument_hash TEXT,
  erstellt_am   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_schicht ON audit_log(schicht_id);

CREATE TABLE IF NOT EXISTS erinnerungen (
  id             TEXT PRIMARY KEY,
  schicht_id     TEXT NOT NULL,
  mitarbeiter_id TEXT,                              -- NULL = Erinnerung an den Kunden
  typ            TEXT NOT NULL,                     -- 'mitarbeiter' | 'kunde'
  kanal          TEXT NOT NULL DEFAULT 'log',       -- später: 'email'
  erstellt_am    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_erinnerungen_schicht ON erinnerungen(schicht_id);
`;
