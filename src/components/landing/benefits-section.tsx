"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation, type TranslationKey } from "@/lib/i18n/language-context";

const benefitKeys: TranslationKey[] = [
  "landing.benefit1",
  "landing.benefit2",
  "landing.benefit3",
  "landing.benefit4",
  "landing.benefit5",
];

type StockStatus = "in" | "low" | "out";

const stockItems: { nameKey: TranslationKey; sku: string; stock: number; status: StockStatus }[] = [
  { nameKey: "landing.invItem1", sku: "SKU-1042", stock: 86, status: "in" },
  { nameKey: "landing.invItem2", sku: "SKU-2031", stock: 4, status: "low" },
  { nameKey: "landing.invItem3", sku: "SKU-3157", stock: 0, status: "out" },
  { nameKey: "landing.invItem4", sku: "SKU-4490", stock: 32, status: "in" },
];

const statusStyles: Record<StockStatus, string> = {
  in: "bg-green-50 text-green-700",
  low: "bg-amber-50 text-amber-700",
  out: "bg-red-50 text-red-700",
};

const statusLabelKeys: Record<StockStatus, TranslationKey> = {
  in: "landing.statusInStock",
  low: "landing.statusLowStock",
  out: "landing.statusOutOfStock",
};

export function BenefitsSection() {
  const { t } = useTranslation();
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              {t("landing.benefitsEyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {t("landing.benefitsTitle")}
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              {t("landing.benefitsSubtitle")}
            </p>
            <ul className="mt-8 space-y-4">
              {benefitKeys.map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                  <span className="text-slate-700">{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <p className="text-sm font-semibold text-slate-900">{t("landing.invTitle")}</p>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                {t("landing.invAttention")}
              </span>
            </div>
            <ul className="divide-y divide-slate-100">
              {stockItems.map((item) => (
                <li key={item.sku} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t(item.nameKey)}</p>
                    <p className="text-xs text-slate-400">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 tabular-nums">
                      {t("landing.invUnits", { count: item.stock })}
                    </p>
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                        statusStyles[item.status],
                      )}
                    >
                      {t(statusLabelKeys[item.status])}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
