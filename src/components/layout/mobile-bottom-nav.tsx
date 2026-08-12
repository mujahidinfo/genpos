"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/auth";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/language-context";
import { navItems } from "./sidebar";

interface MobileBottomNavProps {
  user: AuthUser;
}

const MAX_PRIMARY_TABS = 4;

const GRID_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

export function MobileBottomNav({ user }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);

  // Close the "more" sheet whenever navigation happens (e.g. Android back button).
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const visibleItems = navItems.filter((item) =>
    (item.roles as readonly string[]).includes(user.role),
  );
  const primaryItems = visibleItems.slice(0, MAX_PRIMARY_TABS);
  const overflowItems = visibleItems.slice(MAX_PRIMARY_TABS);
  const hasOverflow = overflowItems.length > 0;
  const columns = primaryItems.length + (hasOverflow ? 1 : 0);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const moreActive = overflowItems.some((item) => isActive(item.href));

  return (
    <>
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-slate-100 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className={cn("grid h-16", GRID_COLS[columns] ?? "grid-cols-4")}>
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
              >
                {active && (
                  <span className="absolute top-1.5 h-1 w-4 rounded-full bg-indigo-600" />
                )}
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    active ? "text-indigo-600" : "text-slate-400",
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none transition-colors",
                    active ? "text-indigo-600" : "text-slate-500",
                  )}
                >
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}
          {hasOverflow && (
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="relative flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
            >
              {moreActive && (
                <span className="absolute top-1.5 h-1 w-4 rounded-full bg-indigo-600" />
              )}
              <MoreHorizontal
                className={cn(
                  "h-5 w-5 transition-colors",
                  moreActive ? "text-indigo-600" : "text-slate-400",
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium leading-none transition-colors",
                  moreActive ? "text-indigo-600" : "text-slate-500",
                )}
              >
                {t("nav.more")}
              </span>
            </button>
          )}
        </div>
      </nav>

      {hasOverflow && moreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="rounded-t-3xl bg-white border-t border-slate-100 shadow-[0_-12px_40px_-8px_rgba(15,23,42,0.25)]"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-slate-200" />
            <div className="flex items-center justify-between px-5 pt-3 pb-1">
              <p className="text-sm font-semibold text-slate-900">{t("nav.more")}</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 px-3 pt-2 pb-2">
              {overflowItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-2xl px-2 py-3 text-xs font-medium transition-colors",
                      active
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-slate-500 hover:bg-slate-50",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
