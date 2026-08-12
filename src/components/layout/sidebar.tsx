"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3,
  Settings, Receipt, Store, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/auth";
import { useTranslation, type TranslationKey } from "@/lib/i18n/language-context";

export const navItems = [
  { labelKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "CASHIER", "INVENTORY_MANAGER"] },
  { labelKey: "nav.sales", href: "/sales", icon: Receipt, roles: ["ADMIN", "CASHIER"] },
  { labelKey: "nav.orders", href: "/orders", icon: ShoppingCart, roles: ["ADMIN", "CASHIER", "INVENTORY_MANAGER"] },
  { labelKey: "nav.inventory", href: "/inventory", icon: Package, roles: ["ADMIN", "INVENTORY_MANAGER"] },
  { labelKey: "nav.customers", href: "/customers", icon: Users, roles: ["ADMIN", "CASHIER"] },
  { labelKey: "nav.analytics", href: "/analytics", icon: BarChart3, roles: ["ADMIN"] },
  { labelKey: "nav.finance", href: "/finance", icon: Wallet, roles: ["ADMIN"] },
  { labelKey: "nav.settings", href: "/settings", icon: Settings, roles: ["ADMIN"] },
] as const satisfies readonly { labelKey: TranslationKey; href: string; icon: React.ElementType; roles: readonly string[] }[];

export type NavItem = (typeof navItems)[number];

interface SidebarProps {
  user: AuthUser;
}

interface NavContentProps {
  items: NavItem[];
  pathname: string;
  onNavigate: () => void;
}

function NavContent({ items, pathname, onNavigate }: NavContentProps) {
  const { t } = useTranslation();
  return (
    <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
              active
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

interface UserSectionProps {
  user: AuthUser;
  initials: string;
}

function UserSection({ user, initials }: UserSectionProps) {
  const { t } = useTranslation();
  const roleKey = `roles.${user.role}` as TranslationKey;
  return (
    <div className="px-3 pb-4 pt-2 border-t border-slate-100">
      <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl">
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate leading-none">{user.name}</p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            {t(roleKey)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const visibleItems = navItems.filter((item) =>
    (item.roles as readonly string[]).includes(user.role),
  );
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-slate-100 bg-white">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
          <Store className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 leading-none">{t("nav.appName")}</p>
          <p className="text-xs text-slate-400 mt-0.5">{t("nav.tagline")}</p>
        </div>
      </div>
      <NavContent items={visibleItems} pathname={pathname} onNavigate={() => {}} />
      <UserSection user={user} initials={initials} />
    </aside>
  );
}
