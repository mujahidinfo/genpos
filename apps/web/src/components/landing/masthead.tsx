"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/language-context";
import { LanguageSwitcher } from "./language-switcher";

/**
 * The rate sheet's masthead: publication name, what the sheet is, and the
 * edition line — set between two rules the way a printed sheet heads its page.
 * Deliberately not a sticky app bar; a sheet does not follow you down the page.
 */
export function Masthead() {
  const { t } = useTranslation();

  return (
    <header className="border-b-2 border-[var(--ink)]">
      <div className="mx-auto max-w-[78rem] px-5 sm:px-8">
        <div className="flex items-end justify-between gap-6 pb-3 pt-5">
          <div className="min-w-0">
            <Link href="/" className="block">
              <span className="block font-[family-name:var(--font-bengali)] text-[1.75rem] leading-none tracking-tight sm:text-[2.25rem]">
                জেনপস
              </span>
              <span className="mt-1 block font-[family-name:var(--font-gothic)] text-[0.68rem] font-600 uppercase tracking-[0.22em] text-[var(--ink-soft)]">
                GenPOS
              </span>
            </Link>
          </div>

          <p className="hidden flex-1 text-center font-[family-name:var(--font-bengali)] text-[0.95rem] text-[var(--ink-soft)] sm:block">
            {t("landing.rsMasthead")}
          </p>

          <div className="flex shrink-0 items-center gap-4">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="hidden font-[family-name:var(--font-gothic)] text-[0.7rem] font-600 uppercase tracking-[0.18em] underline decoration-[var(--rule-strong)] underline-offset-4 transition-colors hover:text-[var(--vermilion)] hover:decoration-[var(--vermilion)] sm:block"
            >
              {t("landing.signIn")}
            </Link>
          </div>
        </div>
      </div>

      {/* The thin second rule of a masthead: edition and scope. */}
      <div className="border-t border-[var(--rule)]">
        <div className="mx-auto flex max-w-[78rem] items-center justify-between gap-4 px-5 py-1.5 font-[family-name:var(--font-gothic)] text-[0.66rem] uppercase tracking-[0.2em] text-[var(--ink-soft)] sm:px-8">
          <span>{t("landing.rsEdition")}</span>
          <span className="hidden sm:inline">{t("landing.rsColophonCurrency")}</span>
          <span>{t("landing.rsColophonRoles")}</span>
        </div>
      </div>
    </header>
  );
}
