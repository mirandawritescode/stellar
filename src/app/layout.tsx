import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, Inter } from "next/font/google";
import Script from "next/script";
import BottomNav from "@/components/BottomNav";
import Sky from "@/components/Sky";
import "./globals.css";

// Keep in sync with THEME_STORAGE_KEY in src/lib/storage/theme.ts — this
// runs before any app code loads, so it can't import the constant.
const THEME_INIT_SCRIPT = `
  try {
    var t = localStorage.getItem("ap:theme");
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}
`;

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["italic", "normal"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Stellar",
  description: "Your to-do list, arranged around your star chart.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#100d20" },
    { media: "(prefers-color-scheme: light)", color: "#fbdccb" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cormorantGaramond.variable} ${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <Sky />
        <main className="flex flex-1 flex-col">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
