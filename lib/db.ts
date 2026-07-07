import path from "path";
import { getDatabaseUrl, isProduction, requireDatabaseUrl } from "./env";
import { SCHEMA_SQL } from "./schema";
import { seedDaten } from "./seed";

/**
 * Datenbank-Layer mit zwei Betriebsarten:
 *
 * 1) DATABASE_URL / POSTGRES_URL gesetzt → echtes Postgres (Neon auf Vercel).
 * 2) Keine URL gesetzt → PGlite: ein vollwertiges, eingebettetes Postgres,
 *    das im Projektordner unter `.data/` persistiert. Damit funktioniert
 *    `npm run dev` lokal komplett ohne Setup.
 *
 * Beim ersten Zugriff wird das Schema angelegt und (falls leer) mit
 * Demo-Daten befüllt.
 */

export interface Db {
  query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  exec(text: string): Promise<void>;
}

declare global {
  // HMR-sicherer Singleton (Next.js dev lädt Module mehrfach)
  // eslint-disable-next-line no-var
  var __szDbPromise: Promise<Db> | undefined;
}

async function createDb(): Promise<Db> {
  if (isProduction()) requireDatabaseUrl();

  const url = getDatabaseUrl();
  if (url) {
    const { Pool } = await import("pg");
    const lokal = /localhost|127\.0\.0\.1/.test(url);
    const pool = new Pool({
      connectionString: url,
      max: 3,
      ssl: lokal ? undefined : { rejectUnauthorized: false },
    });
    return {
      query: async (t, p) => {
        const r = await pool.query(t, p as unknown[]);
        return { rows: r.rows };
      },
      exec: async (t) => {
        await pool.query(t);
      },
    };
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite(path.join(process.cwd(), ".data", "stundenzettel"));
  return {
    query: async (t, p) => {
      const r = await db.query(t, p as unknown[]);
      return { rows: r.rows as Record<string, unknown>[] };
    },
    exec: async (t) => {
      await db.exec(t);
    },
  };
}

async function initDb(): Promise<Db> {
  const db = await createDb();
  await db.exec(SCHEMA_SQL);
  const { rows } = await db.query("SELECT COUNT(*)::int AS n FROM mitarbeiter");
  if (Number(rows[0]?.n ?? 0) === 0) await seedDaten(db);
  return db;
}

export function getDb(): Promise<Db> {
  if (!globalThis.__szDbPromise) globalThis.__szDbPromise = initDb();
  return globalThis.__szDbPromise;
}

/** Bequemer Query-Helfer: `const rows = await query("SELECT ...", [param])` */
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const db = await getDb();
  const { rows } = await db.query(text, params);
  return rows as T[];
}
