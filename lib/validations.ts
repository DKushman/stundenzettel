import { z } from "zod";
import { arbeitsMinuten } from "./time";

/* ────────────────────────────────────────────────────────────────────
 * Ein zod-Schema PRO WIZARD-STEP — jeder Step wird validiert, bevor
 * man weiterspringen kann (Gatekeeping). Serverseitig wird die Abgabe
 * in app/api/eintrag/route.ts erneut vollständig geprüft.
 * ──────────────────────────────────────────────────────────────────── */

export const schrittSchichtSchema = z.object({
  bestaetigt: z
    .boolean()
    .refine((v) => v === true, "Bitte bestätige, dass du in dieser Schicht gearbeitet hast."),
});

export const schrittZeitenSchema = z
  .object({
    checkIn: z.string().min(1, "Check-in fehlt."),
    checkOut: z.string().min(1, "Check-out fehlt."),
    pauseMin: z.coerce
      .number({ invalid_type_error: "Pause in Minuten angeben." })
      .min(0, "Pause kann nicht negativ sein.")
      .max(480, "Pause ist unplausibel lang."),
    notiz: z.string().max(200, "Notiz maximal 200 Zeichen.").optional().or(z.literal("")),
  })
  .refine((d) => d.checkOut > d.checkIn, {
    message: "Check-out muss nach dem Check-in liegen.",
    path: ["checkOut"],
  })
  .refine((d) => arbeitsMinuten(d.checkIn, d.checkOut, 0) > d.pauseMin, {
    message: "Die Pause ist länger als die gesamte Anwesenheit.",
    path: ["pauseMin"],
  });

export const schrittZusammenfassungSchema = z.object({
  richtigkeit: z
    .boolean()
    .refine((v) => v === true, "Bitte bestätige die Richtigkeit deiner Angaben."),
});

export const schrittSignaturSchema = z.object({
  signatur: z.string().min(1, "Ohne Unterschrift kann nicht abgesendet werden."),
});

export type SchrittSchicht = z.infer<typeof schrittSchichtSchema>;
export type SchrittZeiten = z.infer<typeof schrittZeitenSchema>;
export type SchrittZusammenfassung = z.infer<typeof schrittZusammenfassungSchema>;
export type SchrittSignatur = z.infer<typeof schrittSignaturSchema>;
