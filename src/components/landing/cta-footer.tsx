"use client";

import Link from "next/link";
import { ArrowRight, PlayCircle, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/language-context";

export function CtaSection() {
  const { t } = useTranslation();
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white px-6 py-16 text-center sm:px-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t("landing.ctaTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            {t("landing.ctaSubtitle")}
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
                {t("landing.ctaDemo")}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
              <Store className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold leading-none text-slate-900">GenPOS</p>
              <p className="mt-0.5 text-xs text-slate-400">{t("landing.footerTagline")}</p>
            </div>
          </Link>

          <nav className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#features" className="hover:text-slate-900">
              {t("landing.navFeatures")}
            </a>
            <a href="#how-it-works" className="hover:text-slate-900">
              {t("landing.navHowItWorks")}
            </a>
            <a href="#faq" className="hover:text-slate-900">
              {t("landing.navFaq")}
            </a>
            <Link href="/login" className="hover:text-slate-900">
              {t("landing.signIn")}
            </Link>
          </nav>
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">
          {t("landing.footerRights", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
