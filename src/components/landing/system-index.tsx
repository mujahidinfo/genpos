"use client";

import { useTranslation, type TranslationKey } from "@/lib/i18n/language-context";

/**
 * The capabilities set as an almanac index rather than a grid of feature cards:
 * a ruled two-column list you scan, with the section name in the left column and
 * what it does in the right. Density is the point.
 */
const entries: { titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { titleKey: "landing.feature1Title", descKey: "landing.feature1Desc" },
  { titleKey: "landing.feature2Title", descKey: "landing.feature2Desc" },
  { titleKey: "landing.feature3Title", descKey: "landing.feature3Desc" },
  { titleKey: "landing.feature4Title", descKey: "landing.feature4Desc" },
  { titleKey: "landing.feature5Title", descKey: "landing.feature5Desc" },
  { titleKey: "landing.feature6Title", descKey: "landing.feature6Desc" },
];

export function SystemIndex() {
  const { t } = useTranslation();

  return (
    <section id="features" className="scroll-mt-8 border-t-2 border-[var(--ink)]">
      <div className="mx-auto max-w-[78rem] px-5 py-16 sm:px-8 sm:py-24">
        <h2 className="matra max-w-[20ch] pt-4 font-[family-name:var(--font-bengali)] text-[2rem] leading-[1.3] sm:text-[2.6rem]">
          {t("landing.rsIndexHeadline")}
        </h2>

        <dl className="mt-12 border-t-2 border-[var(--ink)]">
          {entries.map(({ titleKey, descKey }) => (
            <div
              key={titleKey}
              className="grid gap-1 border-b border-[var(--rule)] py-5 transition-colors hover:bg-[var(--paper-deep)]/60 sm:grid-cols-[minmax(0,17rem)_1fr] sm:gap-8 sm:py-6"
            >
              <dt className="font-[family-name:var(--font-bengali)] text-[1.05rem] leading-snug">
                {t(titleKey)}
              </dt>
              <dd className="max-w-[62ch] font-[family-name:var(--font-bengali)] text-[0.95rem] leading-[1.75] text-[var(--ink-soft)]">
                {t(descKey)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
