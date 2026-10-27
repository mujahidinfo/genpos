"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Users, Target, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation, type TranslationKey } from "@/lib/i18n/language-context";

const items = [
  { labelKey: "finance.navOverview", href: "/finance", icon: LayoutDashboard, exact: true },
  { labelKey: "finance.navExpenses", href: "/finance/expenses", icon: Receipt, exact: false },
  { labelKey: "finance.navEmployees", href: "/finance/employees", icon: Users, exact: false },
  { labelKey: "finance.navBudget", href: "/finance/budget", icon: Target, exact: false },
  { labelKey: "finance.navReports", href: "/finance/reports", icon: FileText, exact: false },
] as const satisfies readonly { labelKey: TranslationKey; href: string; icon: React.ElementType; exact: boolean }[];

export function FinanceNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  return (
    <div className="flex gap-0.5 border-b border-slate-200 mb-6 overflow-x-auto">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0",
              active
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300",
            )}
          >
            <Icon className="h-4 w-4" />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </div>
  );
}
