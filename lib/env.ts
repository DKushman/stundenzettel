/** Produktions-Checks für sichere Konfiguration auf Vercel. */

export function isProduction() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
}

export function requireDatabaseUrl(): string {
  const url = getDatabaseUrl();
  if (url) return url;
  if (isProduction()) {
    throw new Error(
      "DATABASE_URL fehlt. In Vercel: Storage → Create Database → Neon Postgres, dann neu deployen."
    );
  }
  return "";
}

export function getTokenSecret(): string {
  const secret = process.env.TOKEN_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (isProduction()) {
    throw new Error(
      "TOKEN_SECRET fehlt oder ist zu kurz (min. 32 Zeichen). In Vercel unter Environment Variables setzen."
    );
  }
  return secret || "dev-secret-nur-fuer-lokale-entwicklung";
}

export function getCronSecret(): string {
  const secret = process.env.CRON_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (isProduction()) {
    throw new Error(
      "CRON_SECRET fehlt oder ist zu kurz (min. 16 Zeichen). In Vercel unter Environment Variables setzen."
    );
  }
  return secret || "";
}

export function getAppOrigin(fallback = "http://localhost:3000") {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return fallback;
}
