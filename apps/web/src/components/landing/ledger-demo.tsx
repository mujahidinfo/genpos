"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation, type TranslationKey } from "@/lib/i18n/language-context";
import { useSheetNumber } from "./rate-sheet-hero";

/**
 * The page's one authored moment, and the product's mechanism made literal:
 * select a single sale row and watch the four ledgers a paper khata would have
 * made you write by hand settle themselves.
 *
 * It advances on its own so the mechanism is visible without interaction, and
 * stops permanently the moment a visitor takes control (pointer, focus, or
 * reduced-motion), so it never fights someone who is reading.
 */
type Row = {
  nameKey: TranslationKey;
  amount: number;
  stockFrom: number;
  stockTo: number;
  customer: string;
  bookLineKey: TranslationKey;
};

const rows: Row[] = [
  { nameKey: "landing.previewCartItem1", amount: 760, stockFrom: 24, stockTo: 22, customer: "01712 •• ••34", bookLineKey: "landing.feature6Title" },
  { nameKey: "landing.previewCartItem2", amount: 385, stockFrom: 40, stockTo: 39, customer: "01819 •• ••07", bookLineKey: "landing.feature6Title" },
  { nameKey: "landing.previewCartItem3", amount: 420, stockFrom: 18, stockTo: 15, customer: "01552 •• ••61", bookLineKey: "landing.feature6Title" },
];

export function LedgerDemo() {
  const { t } = useTranslation();
  const num = useSheetNumber();
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoplay) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAutoplay(false);
      return;
    }
    const id = setInterval(() => setActive((i) => (i + 1) % rows.length), 2600);
    return () => clearInterval(id);
  }, [autoplay]);

  const take = (i: number) => { setAutoplay(false); setActive(i); };
  const row = rows[active];
  // Takings accumulate down the sheet, the way a running total actually does.
  const takings = rows.slice(0, active + 1).reduce((s, r) => s + r.amount, 0);

  const ledgers: { labelKey: TranslationKey; noteKey: TranslationKey; value: string; hot?: boolean }[] = [
    { labelKey: "landing.rsLedgerStock", noteKey: "landing.rsLedgerStockNote", value: `${num(row.stockFrom)} → ${num(row.stockTo)}` },
    { labelKey: "landing.rsLedgerCustomer", noteKey: "landing.rsLedgerCustomerNote", value: row.customer },
    { labelKey: "landing.rsLedgerIncome", noteKey: "landing.rsLedgerIncomeNote", value: `৳${num(takings)}`, hot: true },
    { labelKey: "landing.rsLedgerBooks", noteKey: "landing.rsLedgerBooksNote", value: `+ ৳${num(row.amount)}` },
  ];

  return (
    <section className="border-t-2 border-[var(--ink)]">
      <div className="mx-auto max-w-[78rem] px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-[46ch]">
          <h2 className="matra pt-4 font-[family-name:var(--font-bengali)] text-[2rem] leading-[1.3] sm:text-[2.6rem]">
            {t("landing.rsDemoHeadline")}
          </h2>
          <p className="mt-5 font-[family-name:var(--font-bengali)] text-[1.02rem] leading-[1.8] text-[var(--ink-soft)]">
            {t("landing.rsDemoSub")}
          </p>
        </div>

        <div ref={regionRef} className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          {/* The single entry */}
          <div>
            <p className="mb-3 font-[family-name:var(--font-gothic)] text-[0.63rem] font-600 uppercase tracking-[0.2em] text-[var(--ink-soft)]">
              {t("landing.rsDemoHint")}
            </p>
            <ul className="border-2 border-[var(--ink)]">
              {rows.map((r, i) => {
                const on = i === active;
                return (
                  <li key={r.nameKey} className={cn(i > 0 && "border-t border-[var(--rule)]")}>
                    <button
                      type="button"
                      onClick={() => take(i)}
                      onMouseEnter={() => take(i)}
                      onFocus={() => take(i)}
                      aria-pressed={on}
                      className={cn(
                        "flex w-full items-baseline justify-between gap-4 px-4 py-4 text-left transition-colors duration-200",
                        on ? "bg-[var(--vermilion)] text-[var(--paper)]" : "hover:bg-[var(--paper-deep)]",
                      )}
                    >
                      <span className="font-[family-name:var(--font-bengali)] text-[1rem]">
                        {t(r.nameKey)}
                      </span>
                      <span className="font-[family-name:var(--font-gothic)] text-[1rem] font-600 tabular-nums">
                        ৳{num(r.amount)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* The four ledgers it settles */}
          <div aria-live="polite" className="grid gap-px bg-[var(--rule)] sm:grid-cols-2">
            {ledgers.map((l) => (
              <div key={l.labelKey} className="bg-[var(--paper)] px-5 py-6">
                <p className="font-[family-name:var(--font-gothic)] text-[0.63rem] font-600 uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                  {t(l.labelKey)}
                </p>
                {/* No remount on change: re-keying replayed an entrance from
                    opacity 0, so the figure vanished for part of every cycle.
                    The value stays visible and settles instead. */}
                <p
                  className={cn(
                    "mt-2 font-[family-name:var(--font-gothic)] text-[1.7rem] font-700 tabular-nums leading-none transition-[transform,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    l.hot ? "text-[var(--vermilion)]" : "text-[var(--ink)]",
                  )}
                >
                  {l.value}
                </p>
                <p className="mt-3 font-[family-name:var(--font-bengali)] text-[0.85rem] leading-[1.6] text-[var(--ink-soft)]">
                  {t(l.noteKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
