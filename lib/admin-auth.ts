import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE_NAME = "sz_admin_session";

export async function isAdminAuthenticated() {
  const store = await cookies();
  return store.get(ADMIN_COOKIE_NAME)?.value === "1";
}

export async function requireAdmin() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");
}

