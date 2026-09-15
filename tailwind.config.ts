import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f6f7f9",
          900: "#0f172a",
        },
        verdict: {
          base: "#0F172A", // Slate 900 — primary surface
          card: "#1E293B", // Slate 800 — container layers
          brand: "#6366F1", // Indigo 500 — actions & highlights
        },
        risk: {
          critical: "#EF4444",
          criticalBg: "#451A1A",
          caution: "#F59E0B",
          cautionBg: "#453006",
          safe: "#10B981",
          safeBg: "#064E3B",
        },
      },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
