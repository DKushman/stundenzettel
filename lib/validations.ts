import { z } from "zod";
import { arbeitsMinuten } from "./time";

/* ────────────────────────────────────────────────────────────────────
 * Ein zod-Schema PRO WIZARD-STEP — jeder Step wird validiert, bevor
 * man weiterspringen kann (Gatekeeping). Das Gesamtschema kombiniert
 * alles und wird zusätzlich serverseitig geprüft.
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

/** Gesamtschema — wird in der Server Action erneut geprüft. */
export const eintragSchema = z.object({
  schichtId: z.string().min(1),
  mitarbeiterId: z.string().min(1),
  bestaetigt: z.boolean().refine((v) => v === true),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  pauseMin: z.coerce.number().min(0).max(480),
  notiz: z.string().max(200).optional().or(z.literal("")),
  richtigkeit: z.boolean().refine((v) => v === true),
  signatur: z.string().min(1, "Unterschrift fehlt."),
});

export type EintragInput = z.infer<typeof eintragSchema>;
export type SchrittSchicht = z.infer<typeof schrittSchichtSchema>;
export type SchrittZeiten = z.infer<typeof schrittZeitenSchema>;
export type SchrittZusammenfassung = z.infer<typeof schrittZusammenfassungSchema>;
export type SchrittSignatur = z.infer<typeof schrittSignaturSchema>;
