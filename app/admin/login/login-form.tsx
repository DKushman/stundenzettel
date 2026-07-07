"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/lib/admin-actions";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mx-auto mt-12 max-w-md rounded-2xl border border-line bg-card p-6 shadow-card"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await adminLogin(password);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push("/admin");
          router.refresh();
        });
      }}
    >
      <h1 className="text-2xl font-semibold tracking-tight">Admin Login</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Nur der Admin kann Mitarbeiter-Links erstellen und versenden.
      </p>
      <label className="mt-6 block text-sm font-medium">Passwort</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="mt-2 h-11 w-full rounded-xl border border-line bg-card px-3 shadow-card focus:border-ink focus:outline-none"
        placeholder="Admin-Passwort"
      />
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-5 h-11 w-full rounded-xl bg-ink font-medium text-white disabled:opacity-60"
      >
        {pending ? "Prüfe..." : "Einloggen"}
      </button>
    </form>
  );
}

