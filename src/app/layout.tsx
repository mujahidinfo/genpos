import type { Metadata, Viewport } from "next";
import { Inter, Tiro_Bangla, Archivo_Narrow } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// Tiro Bangla ships a single weight (400). The UI leans on 600–900 for headings,
// so browsers synthesise those — `font-synthesis: weight` in globals.css keeps
// that on deliberately, since disabling it would flatten the whole type hierarchy.
const bengali = Tiro_Bangla({
  subsets: ["bengali"],
  weight: "400",
  display: "swap",
  variable: "--font-bengali",
});

// Condensed news gothic: the rate-sheet voice. Carries tabular figures for the
// ledger columns and the column headings, where Tiro Bangla's single weight
// cannot hold a hierarchy on its own.
const gothic = Archivo_Narrow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-gothic",
});

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "GenPOS";

export const metadata: Metadata = {
  title: "GenPOS – Point of Sale",
  description: "Modern point-of-sale system for small shops",
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    // "default" keeps the iOS status bar legible against the light shell.
    statusBarStyle: "default",
  },
  // Phone numbers in receipts/orders shouldn't become tap-to-call links.
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Deliberately NOT setting maximumScale/userScalable — pinch-zoom stays
  // available. The focus-zoom problem is solved with a 16px font on touch
  // devices in globals.css instead.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4f46e5" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

const DIRECTION_CONTRACT = `<!--
THESIS: The shop's day is a rate table — the artifact a Bangladeshi shopkeeper already
reads each morning: one row, many columns, all of it true. Refuses the SaaS POS page
(gradient hero, angled screenshot at 15deg, three pastel feature cards, logo bar).
OWN-WORLD: Warm newsprint ground #F4EFE4 with tooth; exactly two spot inks — ink black
#14110F and vermilion #C8321E. Hairline column rules, ruled blocks, rubber date stamp,
halftone photo plates set in multiply. Tiro Bangla is the voice; Archivo Narrow rules the
columns and tabular figures. No cards, no shadows, no gradients, nothing floats.
STORY: A shopkeeper recognises their own ledger, better kept; believes one entry keeps
every account in agreement; starts free.
FIRST VIEWPORT: Two-rule masthead; headline hung from a continuous matra stroke; beside it
a ruled counter-sale table whose total row carries the only hot ink, with the primary
action set in the table's own vocabulary directly beneath the statement.
FORM: Panjika rate table (Bengali almanac / newspaper commodity rate page), candidate 7 of
7 on the grounded list, seed key b940c090.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Bangla is the default; LanguageProvider updates this client-side when the
    // shop (or a landing visitor) selects English.
    <html lang="bn" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${bengali.variable} ${gothic.variable}`}
        style={{ fontFamily: "var(--font-inter), var(--font-bengali), sans-serif" }}
      >
        {/* Emitted as a real HTML comment — a JSX comment would not survive compilation,
            and the direction contract has to be auditable in the shipped markup. */}
        <div hidden aria-hidden="true" dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} />
        <Providers>{children}</Providers>
        <Toaster />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
