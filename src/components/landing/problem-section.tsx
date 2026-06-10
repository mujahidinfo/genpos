"use client";

import { Calculator, EyeOff, NotebookPen, PackageSearch } from "lucide-react";
import { useTranslation, type TranslationKey } from "@/lib/i18n/language-context";

const problems: { icon: React.ElementType; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: NotebookPen, titleKey: "landing.problem1Title", descKey: "landing.problem1Desc" },
  { icon: PackageSearch, titleKey: "landing.problem2Title", descKey: "landing.problem2Desc" },
  { icon: Calculator, titleKey: "landing.problem3Title", descKey: "landing.problem3Desc" },
  { icon: EyeOff, titleKey: "landing.problem4Title", descKey: "landing.problem4Desc" },
];

export function ProblemSection() {
  const { t } = useTranslation();
  return (
    <section className="border-t border-slate-100 bg-slate-50/60 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            {t("landing.problemEyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t("landing.problemTitle")}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {t("landing.problemSubtitle")}
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
          {problems.map((problem) => (
            <div
              key={problem.titleKey}
              className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                <problem.icon className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{t(problem.titleKey)}</h3>
                <p className="mt-1 text-sm text-slate-600">{t(problem.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
