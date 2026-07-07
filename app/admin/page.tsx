import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { createInviteToken } from "@/lib/invite-token";
import { adminLogout } from "@/lib/admin-actions";
import { getAuftrag, getMitarbeiter, schichten } from "@/lib/data";

export default async function AdminPage() {
  await requireAdmin();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Bereich</h1>
          <p className="text-sm text-ink-soft">Mitarbeiter-Links für den Fragebogen erzeugen und versenden.</p>
        </div>
        <form action={adminLogout}>
          <button className="rounded-xl border border-line bg-card px-4 py-2 text-sm shadow-card">Logout</button>
        </form>
      </div>

      <div className="space-y-4">
        {schichten.map((s) => {
          const auftrag = getAuftrag(s.auftragId);
          return (
            <div key={s.id} className="rounded-2xl border border-line bg-card p-5 shadow-card">
              <p className="font-semibold">{auftrag.titel}</p>
              <p className="text-sm text-ink-soft">
                {new Date(`${s.datum}T00:00:00`).toLocaleDateString("de-DE")} · Geplant {s.beginnGeplant} - {s.endeGeplant}
              </p>
              <div className="mt-4 space-y-2">
                {s.mitarbeiterIds.map((id) => {
                  const m = getMitarbeiter(id);
                  const token = createInviteToken({ schichtId: s.id, mitarbeiterId: id, expiresInHours: 72 });
                  const link = `${baseUrl}/q/${encodeURIComponent(token)}`;
                  return (
                    <div key={id} className="rounded-xl border border-line/70 p-3">
                      <p className="text-sm font-medium">{m.vorname} {m.nachname}</p>
                      <Link href={link} className="mt-1 block break-all text-sm text-blue-600 underline underline-offset-2">
                        {link}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

