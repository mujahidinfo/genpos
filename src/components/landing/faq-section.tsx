"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation, type TranslationKey } from "@/lib/i18n/language-context";

const faqs: { questionKey: TranslationKey; answerKey: TranslationKey }[] = [
  { questionKey: "landing.faq1Q", answerKey: "landing.faq1A" },
  { questionKey: "landing.faq2Q", answerKey: "landing.faq2A" },
  { questionKey: "landing.faq3Q", answerKey: "landing.faq3A" },
  { questionKey: "landing.faq4Q", answerKey: "landing.faq4A" },
  { questionKey: "landing.faq5Q", answerKey: "landing.faq5A" },
];

export function FaqSection() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-slate-100 bg-slate-50/60 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">{t("landing.faqEyebrow")}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t("landing.faqTitle")}
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, index) => {
            const open = openIndex === index;
            return (
              <div key={faq.questionKey} className="rounded-2xl border border-slate-200 bg-white">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                  onClick={() => setOpenIndex(open ? null : index)}
                  aria-expanded={open}
                >
                  <span className="font-medium text-slate-900">{t(faq.questionKey)}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </button>
                {open && (
                  <div className="px-6 pb-4">
                    <p className="text-sm leading-relaxed text-slate-600">{t(faq.answerKey)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
