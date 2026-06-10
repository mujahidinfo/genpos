"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Store, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation, type TranslationKey } from "@/lib/i18n/language-context";
import { LanguageSwitcher } from "./language-switcher";

const navLinks: { href: string; labelKey: TranslationKey }[] = [
  { href: "#features", labelKey: "landing.navFeatures" },
  { href: "#how-it-works", labelKey: "landing.navHowItWorks" },
  { href: "#faq", labelKey: "landing.navFaq" },
];

export function SiteHeader() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
            <Store className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">GenPOS</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {t(link.labelKey)}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <Link href="/login">
            <Button variant="ghost">{t("landing.signIn")}</Button>
          </Link>
          <Link href="/login">
            <Button>{t("landing.getStarted")}</Button>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 md:hidden">
          <LanguageSwitcher className="px-2.5 py-1.5" />
          <button
            className="-mr-2 p-2 text-slate-600"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-slate-600"
              >
                {t(link.labelKey)}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full">
                  {t("landing.signIn")}
                </Button>
              </Link>
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button className="w-full">{t("landing.getStarted")}</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
