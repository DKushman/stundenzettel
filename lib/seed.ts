import type { Db } from "./db";
import { isoHeute, tagOffset } from "./time";

/** Demo-Daten — werden nur eingespielt, wenn die Datenbank leer ist. */

const demoSignatur =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 36'><path d='M6 26 C 18 4, 28 34, 42 18 S 64 6, 74 22 S 96 32, 114 10' fill='none' stroke='#101113' stroke-width='2' stroke-linecap='round'/></svg>`
  );

export async function seedDaten(db: Db) {
  const mitarbeiter = [
    ["m1", "David", "Chiosea", "Mitarbeiter", "#3B82F6", "david@example.com"],
    ["m2", "Anna", "Fischer", "Mitarbeiter", "#8B5CF6", "anna@example.com"],
    ["m3", "Heinrich", "Vogel", "Mitarbeiter", "#F59E0B", "heinrich@example.com"],
    ["m4", "Sabine", "Weber", "Bauleitung", "#EC4899", "sabine@example.com"],
    ["m5", "Klaus", "Berger", "Mitarbeiter", "#10B981", "klaus@example.com"],
    ["m6", "Renate", "Scholz", "Mitarbeiter", "#6366F1", "renate@example.com"],
  ];
  for (const m of mitarbeiter) {
    await db.query(
      "INSERT INTO mitarbeiter (id, vorname, nachname, rolle, farbe, email) VALUES ($1,$2,$3,$4,$5,$6)",
      m
    );
  }

  const auftraege = [
    ["a1", "Rohbau Halle B", "Immobilien AG Nord", "Herr Krüger", "krueger@example.com", "Bauprojekt Nordstadt", "#3B82F6"],
    ["a2", "Fassadensanierung", "Weber Bau GmbH", "Frau Lindner", "lindner@example.com", "Sanierung Weststraße", "#E28412"],
    ["a3", "Innenausbau Kita", "Stadt — Amt für Gebäude", "Herr Öztürk", "oeztuerk@example.com", "Neubau Kita Sonnenhof", "#1CA97A"],
  ];
  for (const a of auftraege) {
    await db.query(
      "INSERT INTO auftraege (id, titel, auftraggeber, ansprechpartner, email, ort, farbe) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      a
    );
  }

  const schichten: [string, string, string, string, string, string[]][] = [
    ["s1", "a1", isoHeute(), "07:00", "16:00", ["m1", "m2", "m3", "m4"]],
    ["s2", "a2", isoHeute(), "08:00", "17:00", ["m5", "m6"]],
    ["s3", "a3", tagOffset(-1), "07:30", "15:30", ["m1", "m5", "m6"]],
    ["s4", "a1", tagOffset(-3), "07:00", "16:00", ["m1", "m2"]],
    ["s5", "a2", tagOffset(1), "07:00", "15:00", ["m1", "m2"]],
    ["s6", "a3", tagOffset(3), "08:00", "16:30", ["m3", "m4", "m5"]],
    ["s7", "a1", tagOffset(2), "06:30", "15:00", ["m1", "m4", "m6"]],
  ];
  for (const [id, auftragId, datum, beginn, ende, mIds] of schichten) {
    await db.query(
      "INSERT INTO schichten (id, auftrag_id, datum, beginn_geplant, ende_geplant) VALUES ($1,$2,$3,$4,$5)",
      [id, auftragId, datum, beginn, ende]
    );
    for (const mId of mIds) {
      await db.query(
        "INSERT INTO schicht_mitarbeiter (schicht_id, mitarbeiter_id) VALUES ($1,$2)",
        [id, mId]
      );
    }
  }

  // Ein paar abgegebene Einträge für die Demo
  const eintraege: [string, string, string, string, string, number, string][] = [
    ["e1", "s1", "m2", "07:05", "16:00", 30, `${isoHeute()}T16:05:00.000Z`],
    ["e2", "s3", "m5", "07:30", "15:30", 30, `${tagOffset(-1)}T15:34:00.000Z`],
    ["e3", "s3", "m6", "07:35", "15:20", 30, `${tagOffset(-1)}T15:31:00.000Z`],
    ["e4", "s4", "m1", "07:00", "16:00", 30, `${tagOffset(-3)}T16:02:00.000Z`],
    ["e5", "s4", "m2", "07:00", "15:45", 30, `${tagOffset(-3)}T15:50:00.000Z`],
  ];
  for (const [id, sId, mId, ci, co, pause, ts] of eintraege) {
    await db.query(
      `INSERT INTO eintraege (id, schicht_id, mitarbeiter_id, check_in, check_out, pause_min, signatur, quelle, dokument_hash, erstellt_am)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'mitarbeiter','demo-seed',$8)`,
      [id, sId, mId, ci, co, pause, demoSignatur, ts]
    );
    await db.query(
      `INSERT INTO audit_log (id, entitaet, entitaet_id, schicht_id, aktion, akteur, akteur_typ, erstellt_am)
       VALUES ($1,'eintrag',$2,$3,'erstellt','Demo-Daten','system',$4)`,
      [`audit-${id}`, id, sId, ts]
    );
  }
}
