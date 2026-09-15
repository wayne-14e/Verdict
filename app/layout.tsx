import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeSwitch } from "@/components/ThemeSwitch";

export const metadata: Metadata = {
  title: "Verdict — Know what you're signing before you sign",
  description:
    "Verdict: Know what you're signing before you sign. Instant AI-powered contract risk analysis, plain-English translations, and counter-offer drafts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased dark:bg-[#0F172A] dark:text-slate-100">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <ThemeSwitch />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
