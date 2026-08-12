"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/language-context";

/** The close: the sheet's last ruled block, then its colophon. */
export function ClosingBlock() {
  const { t } = useTranslation();

  return (
    <section className="border-t-2 border-[var(--ink)]">
      <div className="mx-auto max-w-[78rem] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[34rem] border-2 border-[var(--ink)] bg-[var(--paper-deep)]/60 px-6 py-12 text-center sm:px-12">
          <h2 className="font-[family-name:var(--font-bengali)] text-[1.9rem] leading-[1.35] sm:text-[2.4rem]">
            {t("landing.rsCloseHeadline")}
          </h2>
          <p className="mx-auto mt-4 max-w-[34ch] font-[family-name:var(--font-bengali)] text-[1rem] leading-[1.8] text-[var(--ink-soft)]">
            {t("landing.rsCloseSub")}
          </p>
          <Link
            href="/login"
            className="group mt-8 inline-flex items-center gap-3 border-2 border-[var(--ink)] bg-[var(--ink)] px-8 py-4 font-[family-name:var(--font-bengali)] text-[1.05rem] text-[var(--paper)] transition-colors hover:border-[var(--vermilion)] hover:bg-[var(--vermilion)]"
          >
            {t("landing.rsCta")}
            <span aria-hidden className="font-[family-name:var(--font-gothic)] transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
          <p className="mt-5 font-[family-name:var(--font-bengali)] text-[0.82rem] text-[var(--ink-soft)]">
            {t("landing.rsCtaNote")}
          </p>
        </div>
      </div>
    </section>
  );
}

export function Colophon() {
  const { t } = useTranslation();

  return (
    <footer className="border-t-2 border-[var(--ink)]">
      <div className="mx-auto max-w-[78rem] px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-[family-name:var(--font-bengali)] text-[1.35rem] leading-none">জেনপস</p>
            <p className="mt-1.5 font-[family-name:var(--font-gothic)] text-[0.66rem] font-600 uppercase tracking-[0.2em] text-[var(--ink-soft)]">
              GenPOS · {t("landing.rsMasthead")}
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 font-[family-name:var(--font-bengali)] text-[0.9rem] text-[var(--ink-soft)]">
            <a href="#features" className="underline decoration-[var(--rule)] underline-offset-4 transition-colors hover:text-[var(--vermilion)]">
              {t("landing.navFeatures")}
            </a>
            <a href="#how-it-works" className="underline decoration-[var(--rule)] underline-offset-4 transition-colors hover:text-[var(--vermilion)]">
              {t("landing.navHowItWorks")}
            </a>
            <Link href="/login" className="underline decoration-[var(--rule)] underline-offset-4 transition-colors hover:text-[var(--vermilion)]">
              {t("landing.signIn")}
            </Link>
          </nav>
        </div>

        <p className="mt-8 border-t border-[var(--rule)] pt-4 font-[family-name:var(--font-gothic)] text-[0.66rem] uppercase tracking-[0.18em] text-[var(--ink-soft)]">
          {t("landing.footerRights", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
