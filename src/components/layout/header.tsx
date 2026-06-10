"use client";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { LogOut, ChevronDown, Maximize2, Minimize2 } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import { useLayout } from "./layout-provider";
import { useTranslation } from "@/lib/i18n/language-context";

interface HeaderProps {
  user: AuthUser;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { mode, toggle } = useLayout();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      router.push("/login");
      router.refresh();
    },
  });

  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <header className="h-14 border-b border-slate-100 bg-white flex items-center justify-end px-4 md:px-6 gap-2">

      {/* Layout width toggle */}
      <button
        onClick={toggle}
        title={mode === "focused" ? t("header.switchToFullWidth") : t("header.switchToCentered")}
        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        {mode === "focused" ? (
          <Maximize2 className="h-4 w-4" />
        ) : (
          <Minimize2 className="h-4 w-4" />
        )}
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-100" />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 h-9 px-2.5 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white select-none">{initials}</span>
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700">{user.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-xl border-slate-100 shadow-lg shadow-slate-100/80">
          <DropdownMenuLabel className="font-normal py-2.5">
            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-100" />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg mx-1 my-0.5 cursor-pointer"
            onClick={() => logout.mutate()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t("header.signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
