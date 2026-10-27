"use client";

import Link from "next/link";
import { useTranslation, useLanguage, type TranslationKey } from "@/lib/i18n/language-context";

/**
 * The first viewport is the sheet itself: a headline hung from a matra rule, then
 * a ruled counter-sale table whose final row is the primary action. The offer and
 * the action live inside the table's own grammar rather than in a hero shell.
 *
 * Rows are demonstration data, labelled as such on the page.
 */
const rows: { nameKey: TranslationKey; rate: number; qty: number; amount: number; edited?: boolean }[] = [
  { nameKey: "landing.previewCartItem1", rate: 380, qty: 2, amount: 760 },
  { nameKey: "landing.previewCartItem2", rate: 385, qty: 1, amount: 385, edited: true },
  { nameKey: "landing.previewCartItem3", rate: 140, qty: 3, amount: 420 },
];

const TOTAL = 1565;

export function useSheetNumber() {
  const language = useLanguage();
  const locale = language === "bn" ? "bn-BD-u-nu-latn" : "en-US";
  return (n: number, opts: Intl.NumberFormatOptions = {}) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 0, ...opts }).format(n);
}

export function RateSheetHero() {
  const { t } = useTranslation();
  const num = useSheetNumber();

  return (
    <section className="mx-auto max-w-[78rem] px-5 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-14">
      {/* items-start: a stretched grid item left the ruled table with an empty
          field below its total row when the statement column ran taller. */}
      <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        {/* ── Statement ── */}
        <div className="ink-settle">
          <h1 className="matra pt-4 font-[family-name:var(--font-bengali)] text-[2.6rem] leading-[1.22] tracking-[-0.01em] sm:text-[3.6rem] lg:text-[4rem]">
            {t("landing.rsHeadline")}
            <br />
            <span className="text-[var(--vermilion)]">{t("landing.rsHeadlineAccent")}</span>
          </h1>

          <p className="mt-7 max-w-[38ch] font-[family-name:var(--font-bengali)] text-[1.06rem] leading-[1.85] text-[var(--ink-soft)]">
            {t("landing.rsSub")}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link
              href="/login"
              className="group inline-flex items-center gap-3 border-2 border-[var(--ink)] bg-[var(--ink)] px-7 py-3.5 font-[family-name:var(--font-bengali)] text-[1.05rem] text-[var(--paper)] transition-colors hover:bg-[var(--vermilion)] hover:border-[var(--vermilion)]"
            >
              {t("landing.rsCta")}
              <span aria-hidden className="font-[family-name:var(--font-gothic)] transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/login"
              className="font-[family-name:var(--font-bengali)] text-[0.95rem] text-[var(--ink-soft)] underline decoration-[var(--rule)] underline-offset-4 transition-colors hover:text-[var(--vermilion)] hover:decoration-[var(--vermilion)]"
            >
              {t("landing.rsSignIn")}
            </Link>
          </div>

          <p className="mt-5 font-[family-name:var(--font-bengali)] text-[0.85rem] text-[var(--ink-soft)]">
            {t("landing.rsCtaNote")}
          </p>
        </div>

        {/* ── The sheet ── */}
        <figure className="ink-settle relative m-0 border-2 border-[var(--ink)] bg-[var(--paper-deep)]/40" style={{ animationDelay: "120ms" }}>
          <figcaption className="flex items-baseline justify-between gap-3 border-b border-[var(--rule-strong)] px-4 py-2.5">
            <span className="font-[family-name:var(--font-bengali)] text-[0.9rem]">
              {t("landing.rsTableCaption")}
            </span>
            <span className="stamp px-2 py-0.5 font-[family-name:var(--font-gothic)] text-[0.6rem] font-700 uppercase tracking-[0.18em]">
              {t("landing.demoData")}
            </span>
          </figcaption>

          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--rule-strong)]">
                {([
                  ["landing.rsColItem", "text-left"],
                  ["landing.rsColRate", "text-right"],
                  ["landing.rsColQty", "text-right"],
                  ["landing.rsColTotal", "text-right"],
                ] as const).map(([key, align], i) => (
                  <th
                    key={key}
                    className={`${align} ${i > 0 ? "border-l border-[var(--rule)]" : ""} px-4 py-2 font-[family-name:var(--font-gothic)] text-[0.63rem] font-600 uppercase tracking-[0.2em] text-[var(--ink-soft)]`}
                  >
                    {t(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.nameKey} className="border-b border-[var(--rule)]">
                  <td className="px-4 py-3">
                    <span className="font-[family-name:var(--font-bengali)] text-[0.98rem]">
                      {t(r.nameKey)}
                    </span>
                    {r.edited && (
                      <span className="mt-0.5 block font-[family-name:var(--font-gothic)] text-[0.6rem] uppercase tracking-[0.16em] text-[var(--vermilion)]">
                        {t("landing.rsPriceNegotiable")}
                      </span>
                    )}
                  </td>
                  <td className="border-l border-[var(--rule)] px-4 py-3 text-right font-[family-name:var(--font-gothic)] text-[0.95rem] tabular-nums">
                    {num(r.rate)}
                  </td>
                  <td className="border-l border-[var(--rule)] px-4 py-3 text-right font-[family-name:var(--font-gothic)] text-[0.95rem] tabular-nums">
                    {num(r.qty)}
                  </td>
                  <td className="border-l border-[var(--rule)] px-4 py-3 text-right font-[family-name:var(--font-gothic)] text-[0.95rem] font-600 tabular-nums">
                    {num(r.amount)}
                  </td>
                </tr>
              ))}

              {/* The total row carries the only hot ink on the sheet. */}
              <tr className="border-b-2 border-[var(--ink)] bg-[var(--paper-deep)]/70">
                <td colSpan={3} className="px-4 py-3 font-[family-name:var(--font-bengali)] text-[0.95rem]">
                  {t("landing.rsTotalDue")}
                </td>
                <td className="border-l border-[var(--rule)] px-4 py-3 text-right">
                  <span className="font-[family-name:var(--font-gothic)] text-[1.5rem] font-700 tabular-nums text-[var(--vermilion)]">
                    ৳{num(TOTAL)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

        </figure>
      </div>
    </section>
  );
}
