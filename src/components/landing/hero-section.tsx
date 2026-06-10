"use client";

import Link from "next/link";
import { ArrowRight, AlertTriangle, PlayCircle, Receipt, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation, type TranslationKey } from "@/lib/i18n/language-context";

const weekData: { dayKey: TranslationKey; value: number }[] = [
  { dayKey: "landing.dayMon", value: 45 },
  { dayKey: "landing.dayTue", value: 60 },
  { dayKey: "landing.dayWed", value: 38 },
  { dayKey: "landing.dayThu", value: 75 },
  { dayKey: "landing.dayFri", value: 90 },
  { dayKey: "landing.daySat", value: 100 },
  { dayKey: "landing.daySun", value: 65 },
];

const recentSales: { nameKey: TranslationKey; amount: string; timeKey: TranslationKey }[] = [
  { nameKey: "landing.sale1Name", amount: "$59.00", timeKey: "landing.sale1Time" },
  { nameKey: "landing.sale2Name", amount: "$18.50", timeKey: "landing.sale2Time" },
  { nameKey: "landing.sale3Name", amount: "$24.00", timeKey: "landing.sale3Time" },
];

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-indigo-100/70 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-32 h-80 w-80 rounded-full bg-sky-50 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            {t("landing.heroBadge")}
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            {t("landing.heroTitleLead")} <span className="text-indigo-600">{t("landing.heroTitleHighlight")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            {t("landing.heroSubtitle")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                {t("landing.heroCtaPrimary")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#preview">
              <Button size="lg" variant="outline" className="gap-2">
                <PlayCircle className="h-4 w-4" />
                {t("landing.heroCtaDemo")}
              </Button>
            </a>
          </div>
          <p className="mt-5 text-xs font-medium text-slate-400">{t("landing.heroTrust")}</p>
        </div>

        {/* Dashboard preview — the on-page live demo */}
        <div id="preview" className="relative mx-auto mt-16 max-w-4xl scroll-mt-24">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/60 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                  <PlayCircle className="h-3.5 w-3.5" />
                  {t("landing.previewTag")}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t("landing.previewTitle")}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {t("landing.previewLive")}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600" /> {t("landing.previewSales")}
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">$1,284.50</p>
                <p className="text-xs text-green-600">{t("landing.previewSalesDelta")}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Receipt className="h-3.5 w-3.5 text-indigo-600" /> {t("landing.previewOrders")}
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">42</p>
                <p className="text-xs text-slate-400">{t("landing.previewOrdersSub")}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> {t("landing.previewLowStock")}
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">{t("landing.previewLowStockValue")}</p>
                <p className="text-xs text-slate-400">{t("landing.previewLowStockSub")}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 pt-2 sm:grid-cols-5">
              <div className="sm:col-span-3">
                <p className="mb-3 text-xs font-medium text-slate-500">{t("landing.previewWeek")}</p>
                {/* Bar chart. Columns stretch to the fixed 8rem track height
                    (items-stretch) so each bar's percentage height resolves
                    against a definite height. The previous version put %-height
                    bars inside auto-height columns, so they collapsed to zero. */}
                <div className="flex h-32 items-stretch justify-between gap-2">
                  {weekData.map((d) => (
                    <div key={d.dayKey} className="flex flex-1 flex-col justify-end">
                      <div
                        className={cn(
                          "w-full rounded-md transition-all duration-500",
                          d.value === 100 ? "bg-indigo-600" : "bg-indigo-200",
                        )}
                        style={{ height: `${d.value}%`, minHeight: "8px" }}
                        title={t(d.dayKey)}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between gap-2">
                  {weekData.map((d) => (
                    <span key={d.dayKey} className="flex-1 text-center text-[10px] font-medium text-slate-400">
                      {t(d.dayKey)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <p className="mb-3 text-xs font-medium text-slate-500">{t("landing.previewRecent")}</p>
                <ul className="space-y-2.5">
                  {recentSales.map((sale) => (
                    <li
                      key={sale.nameKey}
                      className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
                          <Receipt className="h-3.5 w-3.5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-900">{t(sale.nameKey)}</p>
                          <p className="text-[10px] text-slate-400">{t(sale.timeKey)}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-slate-900 tabular-nums">{sale.amount}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
