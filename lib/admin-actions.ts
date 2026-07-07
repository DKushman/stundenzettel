"use server";

import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME } from "./admin-auth";

export async function adminLogin(password: string) {
  const expectedPassword = process.env.ADMIN_PASSWORD || "admin123";
  if (!password || password !== expectedPassword) {
    return { ok: false as const, error: "Falsches Passwort." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { ok: true as const };
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

