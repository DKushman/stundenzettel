import { revalidateTag } from "next/cache";

/** Cache für Schicht-/Dashboard-Daten nach Mutationen leeren. */
export function invalidateSchichtCache() {
  revalidateTag("schichten");
}
