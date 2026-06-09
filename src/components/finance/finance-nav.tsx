"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Users, Target, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Overview", href: "/finance", icon: LayoutDashboard, exact: true },
  { label: "Expenses", href: "/finance/expenses", icon: Receipt, exact: false },
  { label: "Employees", href: "/finance/employees", icon: Users, exact: false },
  { label: "Budget", href: "/finance/budget", icon: Target, exact: false },
  { label: "Reports", href: "/finance/reports", icon: FileText, exact: false },
] as const;

export function FinanceNav() {
  const pathname = usePathname();
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
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
