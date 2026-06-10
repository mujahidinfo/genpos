"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { LanguageContext } from "./language-context";
import { DEFAULT_LANGUAGE, type Language } from "./translations";

// Public-page language state. Unlike the dashboard (which reads the shop's
// configured language from the DB), the landing page has no session, so the
// visitor's choice is persisted to localStorage. It feeds the shared
// `LanguageContext`, so `useTranslation()` works inside landing components too.

const STORAGE_KEY = "genpos-landing-lang";

const LandingLanguageControl = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
}>({ language: DEFAULT_LANGUAGE, setLanguage: () => {} });

export function LandingLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "bn") setLanguageState(saved);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  };

  return (
    <LandingLanguageControl.Provider value={{ language, setLanguage }}>
      <LanguageContext.Provider value={language}>
        {children}
      </LanguageContext.Provider>
    </LandingLanguageControl.Provider>
  );
}

export function useLandingLanguage() {
  return useContext(LandingLanguageControl);
}
