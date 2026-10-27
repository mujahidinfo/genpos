"use client";
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type LayoutMode = "focused" | "wide";

const LayoutContext = createContext<{
  mode: LayoutMode;
  toggle: () => void;
}>({ mode: "focused", toggle: () => {} });

export function useLayout() {
  return useContext(LayoutContext);
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<LayoutMode>("focused");

  useEffect(() => {
    const saved = localStorage.getItem("pos-layout-mode");
    if (saved === "wide" || saved === "focused") setMode(saved);
  }, []);

  const toggle = () => {
    setMode((prev) => {
      const next: LayoutMode = prev === "focused" ? "wide" : "focused";
      localStorage.setItem("pos-layout-mode", next);
      return next;
    });
  };

  return (
    <LayoutContext.Provider value={{ mode, toggle }}>
      {children}
    </LayoutContext.Provider>
  );
}
