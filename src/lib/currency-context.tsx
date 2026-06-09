"use client";

import { createContext, useContext, type ReactNode } from "react";
import { trpc } from "@/lib/trpc/client";

const CurrencyContext = createContext("USD");

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { data: shop } = trpc.shop.get.useQuery();
  const currency = shop?.currency ?? "USD";
  return (
    <CurrencyContext.Provider value={currency}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function useFormatCurrency() {
  const currency = useCurrency();

  return (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(amount);
  };
}

export function getCurrencySymbol(currency: string): string {
  try {
    return (
      new Intl.NumberFormat("en-US", { style: "currency", currency })
        .formatToParts(0)
        .find((p) => p.type === "currency")?.value ?? currency
    );
  } catch {
    return currency;
  }
}
