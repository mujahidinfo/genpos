import { Masthead } from "@/components/landing/masthead";
import { RateSheetHero } from "@/components/landing/rate-sheet-hero";
import { LedgerDemo } from "@/components/landing/ledger-demo";
import { PressProof } from "@/components/landing/press-proof";
import { SystemIndex } from "@/components/landing/system-index";
import { OpeningSteps } from "@/components/landing/opening-steps";
import { ClosingBlock, Colophon } from "@/components/landing/colophon";
import { LandingLanguageProvider } from "@/lib/i18n/landing-language-context";

/**
 * The landing page is a printed rate sheet: masthead, the day's table, the
 * mechanism demonstrated, the product photographed, the index, the steps, the
 * close. Every block is ruled; nothing floats.
 */
export function LandingPage() {
  return (
    <LandingLanguageProvider>
      <div className="rate-sheet min-h-screen antialiased">
        <Masthead />
        <main>
          <RateSheetHero />
          <LedgerDemo />
          <PressProof />
          <SystemIndex />
          <OpeningSteps />
          <ClosingBlock />
        </main>
        <Colophon />
      </div>
    </LandingLanguageProvider>
  );
}
