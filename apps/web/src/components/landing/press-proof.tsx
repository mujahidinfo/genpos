"use client";

import Image from "next/image";
import { useTranslation } from "@/lib/i18n/language-context";

/**
 * The product photographed, not illustrated — a real screenshot of the running
 * POS, screened to a halftone plate so it prints as ink on this paper rather
 * than sitting on it as a foreign glossy rectangle.
 */
export function PressProof() {
  const { t } = useTranslation();

  return (
    <section className="border-t-2 border-[var(--ink)] bg-[var(--paper-deep)]/50">
      <div className="mx-auto max-w-[78rem] px-5 py-16 sm:px-8 sm:py-24">
        {/* Align to the top: centring against a tall portrait plate opened a
            dead field above the heading. */}
        <div className="grid gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-start lg:gap-16">
          <div className="order-2 lg:order-1 lg:sticky lg:top-8">
            <h2 className="matra pt-4 font-[family-name:var(--font-bengali)] text-[2rem] leading-[1.3] sm:text-[2.6rem]">
              {t("landing.rsProofHeadline")}
            </h2>
            <p className="mt-5 max-w-[42ch] font-[family-name:var(--font-bengali)] text-[1.02rem] leading-[1.8] text-[var(--ink-soft)]">
              {t("landing.rsProofSub")}
            </p>

            {/* An unordered set of facts, so no sequence numbers — the order
                carries nothing the reader needs. */}
            <ul className="mt-9 border-t border-[var(--rule-strong)]">
              {([
                "landing.rsColophonLangs",
                "landing.rsColophonCurrency",
                "landing.rsColophonRoles",
                "landing.factDevices",
              ] as const).map((k) => (
                <li
                  key={k}
                  className="border-b border-[var(--rule)] py-3 font-[family-name:var(--font-bengali)] text-[0.98rem]"
                >
                  {t(k)}
                </li>
              ))}
            </ul>
          </div>

          {/* The plate */}
          <figure className="order-1 m-0 lg:order-2">
            <div className="relative border-2 border-[var(--ink)] bg-[var(--paper)] p-2">
              <div className="relative aspect-[760/1425] w-full overflow-hidden">
                <Image
                  src="/landing/pos-cart-halftone.png"
                  alt={t("landing.rsProofCaption")}
                  fill
                  sizes="(max-width: 1024px) 90vw, 380px"
                  className="plate object-contain"
                  // Eager: the plate is the section's whole argument, and lazy
                  // loading left it blank on long-page renders.
                  loading="eager"
                  unoptimized
                />
              </div>
            </div>
            <figcaption className="mt-3 border-t border-[var(--rule)] pt-2 font-[family-name:var(--font-bengali)] text-[0.8rem] text-[var(--ink-soft)]">
              {t("landing.rsProofCaption")}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
