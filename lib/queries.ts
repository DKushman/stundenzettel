import { cache } from "react";
import { unstable_cache } from "next/cache";
import { query } from "./db";
import { mitarbeiterToken, kundenToken } from "./invite-token";
import { isoHeute } from "./time";
import {
  schichtStatusBerechnen,
  istErinnerungFaellig,
  type AuditView,
  type EintragView,
  type FaelligeErinnerung,
  type KundeView,
  type Mitarbeiter,
  type SchichtView,
  type UnternehmenView,
  type ZuweisungView,
} from "./data";

type SchichtRow = {
  id: string;
  auftrag_id: string;
  datum: string;
  beginn_geplant: string;
  ende_geplant: string;
  kunde_name: string | null;
  kunde_signatur: string | null;
  kunde_unterschrieben_am: string | null;
  kunde_dokument_hash: string | null;
  titel: string;
  auftraggeber: string;
  ansprechpartner: string | null;
  auftrag_email: string | null;
  ort: string;
  farbe: string;
};

type ZuweisungRow = Mitarbeiter & { schicht_id: string };

type EintragRow = {
  id: string;
  schicht_id: string;
  mitarbeiter_id: string;
  check_in: string;
  check_out: string;
  pause_min: number;
  notiz: string | null;
  signatur: string | null;
  quelle: "mitarbeiter" | "disposition";
  dokument_hash: string | null;
  erstellt_am: string;
  geaendert_am: string | null;
};

function mapEintrag(e: EintragRow): EintragView {
  return {
    id: e.id,
    mitarbeiterId: e.mitarbeiter_id,
    checkIn: e.check_in,
    checkOut: e.check_out,
    pauseMin: Number(e.pause_min),
    notiz: e.notiz,
    signatur: e.signatur,
    quelle: e.quelle,
    dokumentHash: e.dokument_hash,
    erstelltAm: e.erstellt_am,
    geaendertAm: e.geaendert_am,
  };
}

type LookupData = {
  zuweisungenBySchicht: Map<string, ZuweisungRow[]>;
  eintraegeBySchichtMa: Map<string, EintragRow>;
};

function eintragKey(schichtId: string, mitarbeiterId: string) {
  return `${schichtId}:${mitarbeiterId}`;
}

function buildLookups(zuweisungen: ZuweisungRow[], eintraege: EintragRow[]): LookupData {
  const zuweisungenBySchicht = new Map<string, ZuweisungRow[]>();
  for (const z of zuweisungen) {
    const list = zuweisungenBySchicht.get(z.schicht_id) ?? [];
    list.push(z);
    zuweisungenBySchicht.set(z.schicht_id, list);
  }

  const eintraegeBySchichtMa = new Map<string, EintragRow>();
  for (const e of eintraege) {
    eintraegeBySchichtMa.set(eintragKey(e.schicht_id, e.mitarbeiter_id), e);
  }

  return { zuweisungenBySchicht, eintraegeBySchichtMa };
}

function buildSchichtView(
  s: SchichtRow,
  lookups: LookupData,
  opts: { withTokens: boolean }
): SchichtView {
  const heute = isoHeute();
  const jetzt = Date.now();
  const zuRows = lookups.zuweisungenBySchicht.get(s.id) ?? [];

  const zu: ZuweisungView[] = zuRows.map((z) => {
    const e = lookups.eintraegeBySchichtMa.get(eintragKey(s.id, z.id));
    return {
      mitarbeiter: {
        id: z.id,
        vorname: z.vorname,
        nachname: z.nachname,
        rolle: z.rolle,
        farbe: z.farbe,
        email: z.email,
      },
      token: opts.withTokens ? mitarbeiterToken(s.id, z.id) : "",
      eintrag: e ? mapEintrag(e) : null,
    };
  });

  const kunde: KundeView | null =
    s.kunde_signatur && s.kunde_name && s.kunde_unterschrieben_am
      ? {
          name: s.kunde_name,
          signatur: s.kunde_signatur,
          unterschriebenAm: s.kunde_unterschrieben_am,
          dokumentHash: s.kunde_dokument_hash,
        }
      : null;

  const faellige: FaelligeErinnerung[] = [];
  if (istErinnerungFaellig(s.datum, s.ende_geplant, jetzt)) {
    for (const z of zu) {
      if (!z.eintrag) {
        faellige.push({
          typ: "mitarbeiter",
          mitarbeiterId: z.mitarbeiter.id,
          name: `${z.mitarbeiter.vorname} ${z.mitarbeiter.nachname}`,
          pfad: `/erfassen/${mitarbeiterToken(s.id, z.mitarbeiter.id)}`,
          email: z.mitarbeiter.email,
        });
      }
    }
    if (faellige.length === 0 && !kunde && zu.length > 0) {
      faellige.push({
        typ: "kunde",
        name: s.ansprechpartner ?? s.auftraggeber,
        pfad: `/unterschrift/${kundenToken(s.id)}`,
        email: s.auftrag_email,
      });
    }
  }

  return {
    id: s.id,
    datum: s.datum,
    beginnGeplant: s.beginn_geplant,
    endeGeplant: s.ende_geplant,
    auftrag: {
      id: s.auftrag_id,
      titel: s.titel,
      auftraggeber: s.auftraggeber,
      ansprechpartner: s.ansprechpartner,
      email: s.auftrag_email,
      ort: s.ort,
      farbe: s.farbe,
    },
    zuweisungen: zu,
    kunde,
    kundenToken: opts.withTokens ? kundenToken(s.id) : "",
    status: schichtStatusBerechnen(s.datum, zu, kunde, heute),
    faelligeErinnerungen: faellige,
  };
}

async function loadSchichtListData() {
  const [schichten, zuweisungen, eintraege] = await Promise.all([
    query<SchichtRow>(
      `SELECT s.*, a.titel, a.auftraggeber, a.ansprechpartner, a.email AS auftrag_email, a.ort, a.farbe
       FROM schichten s JOIN auftraege a ON a.id = s.auftrag_id
       ORDER BY s.datum DESC, s.beginn_geplant ASC`
    ),
    query<ZuweisungRow>(
      `SELECT z.schicht_id, m.id, m.vorname, m.nachname, m.rolle, m.farbe, m.email
       FROM schicht_mitarbeiter z JOIN mitarbeiter m ON m.id = z.mitarbeiter_id`
    ),
    query<EintragRow>(
      `SELECT id, schicht_id, mitarbeiter_id, check_in, check_out, pause_min, notiz, signatur, quelle, dokument_hash, erstellt_am, geaendert_am FROM eintraege`
    ),
  ]);
  return { schichten, lookups: buildLookups(zuweisungen, eintraege) };
}

const getSchichtViewsCached = unstable_cache(
  async () => {
    const { schichten, lookups } = await loadSchichtListData();
    return schichten.map((s) => buildSchichtView(s, lookups, { withTokens: false }));
  },
  ["schicht-views-v1"],
  { revalidate: 60, tags: ["schichten"] }
);

/** Alle Schichten für Dashboard/Kalender (ohne Token-Overhead, gecacht). */
export async function getSchichtViews(): Promise<SchichtView[]> {
  return getSchichtViewsCached();
}

/** Einzelne Schicht für A4-Detailseite — nur relevante Daten + Tokens. */
export const getSchichtViewById = cache(async (id: string): Promise<SchichtView | null> => {
  const schichten = await query<SchichtRow>(
    `SELECT s.*, a.titel, a.auftraggeber, a.ansprechpartner, a.email AS auftrag_email, a.ort, a.farbe
     FROM schichten s JOIN auftraege a ON a.id = s.auftrag_id
     WHERE s.id = $1`,
    [id]
  );
  const s = schichten[0];
  if (!s) return null;

  const [zuweisungen, eintraege] = await Promise.all([
    query<ZuweisungRow>(
      `SELECT z.schicht_id, m.id, m.vorname, m.nachname, m.rolle, m.farbe, m.email
       FROM schicht_mitarbeiter z JOIN mitarbeiter m ON m.id = z.mitarbeiter_id
       WHERE z.schicht_id = $1`,
      [id]
    ),
    query<EintragRow>(
      `SELECT id, schicht_id, mitarbeiter_id, check_in, check_out, pause_min, notiz, signatur, quelle, dokument_hash, erstellt_am, geaendert_am
       FROM eintraege WHERE schicht_id = $1`,
      [id]
    ),
  ]);

  return buildSchichtView(s, buildLookups(zuweisungen, eintraege), { withTokens: true });
});

const getUnternehmenCached = unstable_cache(
  async () => {
    const rows = await query<{
      id: string;
      auftraggeber: string;
      titel: string;
      ort: string;
      farbe: string;
      anzahl_schichten: number;
    }>(
      `SELECT a.id, a.auftraggeber, a.titel, a.ort, a.farbe,
              COUNT(s.id)::int AS anzahl_schichten
       FROM auftraege a
       LEFT JOIN schichten s ON s.auftrag_id = a.id
       GROUP BY a.id, a.auftraggeber, a.titel, a.ort, a.farbe
       ORDER BY a.auftraggeber ASC, a.titel ASC`
    );
    return rows.map((r) => ({
      id: r.id,
      auftraggeber: r.auftraggeber,
      titel: r.titel,
      ort: r.ort,
      farbe: r.farbe,
      anzahlSchichten: Number(r.anzahl_schichten),
    }));
  },
  ["unternehmen-v1"],
  { revalidate: 300, tags: ["unternehmen"] }
);

export async function getUnternehmen(): Promise<UnternehmenView[]> {
  return getUnternehmenCached();
}

export async function getAuditFuerSchicht(schichtId: string): Promise<AuditView[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT * FROM audit_log WHERE schicht_id = $1 ORDER BY erstellt_am DESC`,
    [schichtId]
  );
  return rows.map((r) => ({
    id: String(r.id),
    entitaet: String(r.entitaet),
    entitaetId: String(r.entitaet_id),
    aktion: String(r.aktion),
    feld: (r.feld as string) ?? null,
    altWert: (r.alt_wert as string) ?? null,
    neuWert: (r.neu_wert as string) ?? null,
    akteur: String(r.akteur),
    akteurTyp: String(r.akteur_typ),
    userAgent: (r.user_agent as string) ?? null,
    ip: (r.ip as string) ?? null,
    dokumentHash: (r.dokument_hash as string) ?? null,
    erstelltAm: String(r.erstellt_am),
  }));
}

export async function erinnerungKuerzlichGesendet(
  schichtId: string,
  mitarbeiterId: string | null,
  typ: "mitarbeiter" | "kunde"
): Promise<boolean> {
  const seit = new Date(Date.now() - 24 * 3_600_000).toISOString();
  const rows = mitarbeiterId
    ? await query(
        `SELECT 1 FROM erinnerungen WHERE schicht_id=$1 AND mitarbeiter_id=$2 AND typ=$3 AND erstellt_am > $4 LIMIT 1`,
        [schichtId, mitarbeiterId, typ, seit]
      )
    : await query(
        `SELECT 1 FROM erinnerungen WHERE schicht_id=$1 AND mitarbeiter_id IS NULL AND typ=$2 AND erstellt_am > $3 LIMIT 1`,
        [schichtId, typ, seit]
      );
  return rows.length > 0;
}
