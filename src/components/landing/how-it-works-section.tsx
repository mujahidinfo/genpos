"use client";

import { useTranslation, type TranslationKey } from "@/lib/i18n/language-context";

const steps: { number: string; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { number: "01", titleKey: "landing.step1Title", descKey: "landing.step1Desc" },
  { number: "02", titleKey: "landing.step2Title", descKey: "landing.step2Desc" },
  { number: "03", titleKey: "landing.step3Title", descKey: "landing.step3Desc" },
];

export function HowItWorksSection() {
  const { t } = useTranslation();
  return (
    <section id="how-it-works" className="border-t border-slate-100 bg-slate-50/60 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            {t("landing.howEyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t("landing.howTitle")}
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-10 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white">
                {step.number}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{t(step.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(step.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
