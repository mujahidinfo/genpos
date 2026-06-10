"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { trpc } from "@/lib/trpc/client";
import {
  translations,
  DEFAULT_LANGUAGE,
  type Language,
  type TranslationSchema,
} from "./translations";

// Recursively builds the union of valid dot-paths, e.g. "nav.dashboard",
// so `t()` gets autocomplete and compile-time key checking.
type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? `${K}.${DotPaths<T[K]>}`
    : K;
}[keyof T & string];

export type TranslationKey = DotPaths<TranslationSchema>;

type Vars = Record<string, string | number>;

export const LanguageContext = createContext<Language>(DEFAULT_LANGUAGE);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { data: shop } = trpc.shop.get.useQuery();
  const language: Language =
    shop?.language === "bn" || shop?.language === "en"
      ? shop.language
      : DEFAULT_LANGUAGE;

  // Keep the document language in sync for accessibility / font fallback.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={language}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

function resolveKey(language: Language, key: string): string {
  const walk = (obj: unknown): string | undefined => {
    let current: unknown = obj;
    for (const part of key.split(".")) {
      if (current && typeof current === "object" && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return typeof current === "string" ? current : undefined;
  };

  // Fall back to English, then to the raw key, so a missing translation is
  // never a crash — at worst the English string (or key) shows.
  return walk(translations[language]) ?? walk(translations.en) ?? key;
}

function interpolate(str: string, vars?: Vars): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function useTranslation() {
  const language = useLanguage();

  const t = useMemo(
    () => (key: TranslationKey, vars?: Vars) =>
      interpolate(resolveKey(language, key), vars),
    [language],
  );

  return { t, language };
}
