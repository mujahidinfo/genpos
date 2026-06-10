"use client";

import { BarChart3, Package, Receipt, ShoppingCart, Users, Wallet } from "lucide-react";
import { useTranslation, type TranslationKey } from "@/lib/i18n/language-context";

const features: { icon: React.ElementType; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: Receipt, titleKey: "landing.feature1Title", descKey: "landing.feature1Desc" },
  { icon: Package, titleKey: "landing.feature2Title", descKey: "landing.feature2Desc" },
  { icon: ShoppingCart, titleKey: "landing.feature3Title", descKey: "landing.feature3Desc" },
  { icon: Users, titleKey: "landing.feature4Title", descKey: "landing.feature4Desc" },
  { icon: BarChart3, titleKey: "landing.feature5Title", descKey: "landing.feature5Desc" },
  { icon: Wallet, titleKey: "landing.feature6Title", descKey: "landing.feature6Desc" },
];

export function FeaturesSection() {
  const { t } = useTranslation();
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            {t("landing.featuresEyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t("landing.featuresTitle")}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {t("landing.featuresSubtitle")}
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.titleKey}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-lg hover:shadow-slate-100"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                <feature.icon className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{t(feature.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
