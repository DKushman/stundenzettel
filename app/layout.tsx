import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { PwaRegister } from "@/components/pwa-register";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Zeiterfassung",
  description: "Mobile Stundenzettelerfassung mit digitaler Unterschrift",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Stundenzettel",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F6F7F9",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={inter.variable}>
      <body>
        <PwaRegister />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
