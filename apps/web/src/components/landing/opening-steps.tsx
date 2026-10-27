"use client";

import { useTranslation, type TranslationKey } from "@/lib/i18n/language-context";

/**
 * Three steps, numbered because the order is the information — you cannot sell
 * before the shop exists. Set as ruled columns of a sheet, not as cards.
 */
const steps: { titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { titleKey: "landing.step1Title", descKey: "landing.step1Desc" },
  { titleKey: "landing.step2Title", descKey: "landing.step2Desc" },
  { titleKey: "landing.step3Title", descKey: "landing.step3Desc" },
];

export function OpeningSteps() {
  const { t } = useTranslation();

  return (
    <section id="how-it-works" className="scroll-mt-8 border-t-2 border-[var(--ink)] bg-[var(--paper-deep)]/50">
      <div className="mx-auto max-w-[78rem] px-5 py-16 sm:px-8 sm:py-24">
        <h2 className="matra max-w-[20ch] pt-4 font-[family-name:var(--font-bengali)] text-[2rem] leading-[1.3] sm:text-[2.6rem]">
          {t("landing.rsStepsHeadline")}
        </h2>

        <ol className="mt-12 grid gap-px bg-[var(--rule)] sm:grid-cols-3">
          {steps.map(({ titleKey, descKey }, i) => (
            <li key={titleKey} className="bg-[var(--paper)] px-5 py-7 sm:px-6 sm:py-8">
              <span className="font-[family-name:var(--font-gothic)] text-[2.4rem] font-700 leading-none tabular-nums text-[var(--vermilion)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 font-[family-name:var(--font-bengali)] text-[1.1rem] leading-snug">
                {t(titleKey)}
              </h3>
              <p className="mt-2.5 font-[family-name:var(--font-bengali)] text-[0.92rem] leading-[1.75] text-[var(--ink-soft)]">
                {t(descKey)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
