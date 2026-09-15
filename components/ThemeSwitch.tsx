"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="fixed bottom-6 left-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border shadow-lg transition-all duration-200 hover:scale-105"
      style={{
        background: theme === "dark" ? "#1E293B" : "#ffffff",
        borderColor: theme === "dark" ? "rgba(148,163,184,0.2)" : "rgba(15,23,42,0.1)",
        color: theme === "dark" ? "#f1f5f9" : "#0f172a",
        boxShadow:
          theme === "dark"
            ? "0 4px 12px rgba(0,0,0,0.4)"
            : "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
