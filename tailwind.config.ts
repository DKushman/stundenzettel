import type { Config } from "tailwindcss";

/**
 * Design-Tokens — abgeleitet aus dem Kanzlei-Screenshot:
 * helle Grundfläche, weiße Karten mit feinen Rändern,
 * Near-Black als Marken-/Aktionsfarbe, Status-Farben mit Punkt-Badges.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#F6F7F9",        // Seitenhintergrund
        card: "#FFFFFF",
        line: "#E8EAEE",           // Hairline-Border wie im Screenshot
        ink: {
          DEFAULT: "#101113",      // Primärtext / dunkle Karte
          soft: "#5C6370",         // Sekundärtext (E-Mails, Labels)
          faint: "#9AA0AB",        // Tertiär (Platzhalter, "–")
        },
        status: {
          open: "#3B82F6",         // Offen  → blauer Punkt ("Neu" im Screenshot)
          openBg: "#EAF1FE",
          progress: "#E28412",     // Eingereicht → orange ("In Bearbeitung")
          progressBg: "#FBF3E7",
          done: "#1CA97A",         // Genehmigt → grün ("Erledigt")
          doneBg: "#E7F6EF",
          teilweise: "#8B5CF6",    // Teilweise erfasst → lila
          teilweiseBg: "#F3EEFE",
        },
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,17,19,0.04)",
        sheet: "0 -8px 40px rgba(16,17,19,0.16)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
