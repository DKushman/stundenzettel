import { AppDataProvider } from "@/components/app-data-provider";
import { AppShell } from "@/components/app-shell";

/** Persistente Shell: Sidebar bleibt gemountet, nur {children} wechselt. */
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppDataProvider>
      <AppShell>{children}</AppShell>
    </AppDataProvider>
  );
}
