import { redirect } from "next/navigation";
import { AdminLoginForm } from "./login-form";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/admin");
  return <AdminLoginForm />;
}

