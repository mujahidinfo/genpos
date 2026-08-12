"use client";

import { createContext, useContext, type ReactNode } from "react";
import { trpc } from "@/lib/trpc/client";
import { useLanguage } from "@/lib/i18n/language-context";
import type { Language } from "@/lib/i18n/translations";

const CurrencyContext = createContext("BDT");

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { data: shop } = trpc.shop.get.useQuery();
  const currency = shop?.currency ?? "BDT";
  return (
    <CurrencyContext.Provider value={currency}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

/**
 * Bangla uses the bn-BD locale so BDT renders with its native ৳ symbol instead of
 * the "BDT" literal en-US produces. The `-u-nu-latn` extension forces Western
 * digits: Bengali numerals would otherwise appear in totals while the price
 * inputs (typed on a Latin keypad) stayed Western, which reads as a bug at the till.
 */
function localeFor(language: Language): string {
  return language === "bn" ? "bn-BD-u-nu-latn" : "en-US";
}

export function useFormatCurrency() {
  const currency = useCurrency();
  const locale = localeFor(useLanguage());

  return (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(amount);
  };
}

/**
 * Exact, non-compact currency formatting — use anywhere the number is money the
 * customer actually pays (cart lines, totals, invoices, receipts). The compact
 * formatter above renders 1234.56 as "৳1.2K", which is fine for KPI tiles but
 * unusable at the till.
 */
export function useFormatCurrencyExact() {
  const currency = useCurrency();
  const locale = localeFor(useLanguage());

  return (amount: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * `locale` defaults to en-US so a picker listing world currencies shows each
 * one's neutral symbol. For the shop's own active currency prefer
 * `useCurrencySymbol()`, which resolves in the shop's language (BDT → ৳).
 */
export function getCurrencySymbol(currency: string, locale = "en-US"): string {
  try {
    return (
      new Intl.NumberFormat(locale, { style: "currency", currency })
        .formatToParts(0)
        .find((p) => p.type === "currency")?.value ?? currency
    );
  } catch {
    return currency;
  }
}

/** Symbol for the active shop currency, resolved in the active language. */
export function useCurrencySymbol(): string {
  const currency = useCurrency();
  const language = useLanguage();
  return getCurrencySymbol(currency, language === "bn" ? "bn-BD" : "en-US");
}
