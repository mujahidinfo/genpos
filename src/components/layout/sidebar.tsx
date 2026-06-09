"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3,
  Settings, Receipt, Menu, X, Store
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/auth";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "CASHIER", "INVENTORY_MANAGER"] },
  { label: "Sales / POS", href: "/sales", icon: Receipt, roles: ["ADMIN", "CASHIER"] },
  { label: "Orders", href: "/orders", icon: ShoppingCart, roles: ["ADMIN", "CASHIER", "INVENTORY_MANAGER"] },
  { label: "Inventory", href: "/inventory", icon: Package, roles: ["ADMIN", "INVENTORY_MANAGER"] },
  { label: "Customers", href: "/customers", icon: Users, roles: ["ADMIN", "CASHIER"] },
  { label: "Analytics", href: "/analytics", icon: BarChart3, roles: ["ADMIN"] },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["ADMIN"] },
] as const;

interface SidebarProps {
  user: AuthUser;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleItems = navItems.filter((item) =>
    (item.roles as readonly string[]).includes(user.role)
  );
  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const NavContent = () => (
    <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
              active
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const UserSection = () => (
    <div className="px-3 pb-4 pt-2 border-t border-slate-100">
      <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl">
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate leading-none">{user.name}</p>
          <p className="text-xs text-slate-400 capitalize mt-0.5 truncate">
            {user.role.toLowerCase().replace("_", " ")}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex w-60 flex-col border-r border-slate-100 bg-white">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
            <Store className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 leading-none">GenPOS</p>
            <p className="text-xs text-slate-400 mt-0.5">Point of Sale</p>
          </div>
        </div>
        <NavContent />
        <UserSection />
      </aside>

      {/* Mobile trigger */}
      <div className="md:hidden">
        <button
          className="fixed top-3.5 left-4 z-50 p-2 rounded-xl bg-white border border-slate-200 shadow-sm"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-4 w-4 text-slate-600" /> : <Menu className="h-4 w-4 text-slate-600" />}
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div className="w-64 bg-white border-r border-slate-100 flex flex-col pt-14">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Store className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="font-bold text-slate-900">GenPOS</p>
              </div>
              <NavContent />
              <UserSection />
            </div>
            <div
              className="flex-1 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
          </div>
        )}
      </div>
    </>
  );
}
