import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { cookies } from "next/headers";
import { SidebarPreferenceProvider } from "./components/sidebar-preference-provider";
import { StartupLoader } from "./components/startup-loader";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AuditIA - Tu AI Product Manager",
  description:
    "AuditIA analiza automáticamente tu web para optimizar UX, Performance, Accesibilidad y SEO con un roadmap visual priorizado.",
  keywords: ["UX", "Performance", "SEO", "Accesibilidad", "AI Product Manager"],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const initialCollapsed =
    cookieStore.get("sidebar-collapsed")?.value === "true";
  const rawTheme = cookieStore.get("auditia-theme")?.value;
  const initialTheme =
    rawTheme === "light" || rawTheme === "dark" ? rawTheme : undefined;
  const rawLanguage = cookieStore.get("auditia-lang")?.value;
  const initialLanguage = rawLanguage === "en" ? "en" : "es";

  return (
    <html
      lang={initialLanguage}
      data-theme={initialTheme}
      className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
      style={{
        ["--sidebar-w" as string]: initialCollapsed ? "3.5rem" : "15rem",
      }}
    >
      <body className="min-h-full flex flex-col">
        <SidebarPreferenceProvider initialCollapsed={initialCollapsed}>
          <StartupLoader />
          {children}
        </SidebarPreferenceProvider>
      </body>
    </html>
  );
}
