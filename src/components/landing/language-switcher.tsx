"use client";

import { Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGES } from "@/lib/i18n/translations";
import { useLandingLanguage } from "@/lib/i18n/landing-language-context";

// Language picker for the public landing page. New languages added to the
// `LANGUAGES` array in translations.ts appear here automatically.
export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useLandingLanguage();
  const active = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
            className,
          )}
          aria-label="Change language"
        >
          <Globe className="h-4 w-4" />
          <span>{active.nativeLabel}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-xl border-slate-100 shadow-lg">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="cursor-pointer rounded-lg mx-1 my-0.5 flex items-center justify-between"
          >
            <span className="flex flex-col">
              <span className="text-sm font-medium text-slate-800">{lang.nativeLabel}</span>
              <span className="text-[11px] text-slate-400">{lang.label}</span>
            </span>
            {lang.code === language && <Check className="h-4 w-4 text-indigo-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
