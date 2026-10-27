"use client";

import { ThemeProvider } from "next-themes";
import { TRPCProvider } from "@/lib/trpc/client";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TRPCProvider>{children}</TRPCProvider>
    </ThemeProvider>
  );
}
