"use client";
import { useLayout } from "./layout-provider";
import type { ReactNode } from "react";

export function MainWrapper({ children }: { children: ReactNode }) {
  const { mode } = useLayout();
  return (
    <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-6">
      <div className={mode === "focused" ? "min-h-full max-w-4xl mx-auto" : "min-h-full"}>
        {children}
      </div>
    </main>
  );
}
