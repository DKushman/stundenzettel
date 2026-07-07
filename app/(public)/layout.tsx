/** Öffentliche Token-Seiten ohne Disposition-Sidebar. */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh px-[clamp(0.75rem,3vw,1.25rem)] py-[clamp(1rem,4vw,2.5rem)] print:p-0">
      {children}
    </main>
  );
}
