"use client";

import { cn } from "@/lib/utils";
import { LANGUAGES } from "@/lib/i18n/translations";
import { useLandingLanguage } from "@/lib/i18n/landing-language-context";

/**
 * A ruled two-state toggle rather than a dropdown: with two languages a menu is
 * a click tax, and a stock popover would be the only floating object on a sheet
 * where nothing floats. New entries in `LANGUAGES` still appear automatically.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useLandingLanguage();

  return (
    <div
      className={cn("flex items-stretch border border-[var(--rule-strong)]", className)}
      role="group"
      aria-label="Language"
    >
      {/* Bangla first: it is the default language, so it leads the control. */}
      {[...LANGUAGES].sort((a) => (a.code === "bn" ? -1 : 1)).map((lang, i) => {
        const on = lang.code === language;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            aria-pressed={on}
            className={cn(
              "px-2.5 py-1 font-[family-name:var(--font-gothic)] text-[0.68rem] font-600 uppercase tracking-[0.14em] transition-colors",
              i > 0 && "border-l border-[var(--rule-strong)]",
              on
                ? "bg-[var(--ink)] text-[var(--paper)]"
                : "text-[var(--ink-soft)] hover:text-[var(--vermilion)]",
            )}
          >
            {lang.code === "bn" ? "বাং" : "EN"}
          </button>
        );
      })}
    </div>
  );
}
