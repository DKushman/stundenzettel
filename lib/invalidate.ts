import { revalidateTag } from "next/cache";

/** Cache für Schicht-/Dashboard-Daten nach Mutationen leeren. */
export function invalidateSchichtCache() {
  revalidateTag("schichten");
}

export function invalidateUnternehmenCache() {
  revalidateTag("unternehmen");
}

export function invalidateDashboardCache() {
  revalidateTag("schichten");
  revalidateTag("unternehmen");
}
