import type { Metadata } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-bengali",
});

export const metadata: Metadata = {
  title: "GenPOS – Point of Sale",
  description: "Modern point-of-sale system for small shops",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${bengali.variable}`}
        style={{ fontFamily: "var(--font-inter), var(--font-bengali), sans-serif" }}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
