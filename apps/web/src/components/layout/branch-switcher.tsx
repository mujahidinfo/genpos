"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Plus, Store } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import type { AuthUser } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n/language-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Shows the active business/branch; switch with one click, owners can open a new branch. */
export function BranchSwitcher({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const onSwitched = async () => {
    // Every cached query belongs to the previous branch.
    await utils.invalidate();
    router.refresh();
  };

  const switchShop = trpc.auth.switchShop.useMutation({ onSuccess: onSwitched });
  const addBranch = trpc.auth.addBranch.useMutation({
    onSuccess: (branch) => {
      setAdding(false);
      setName("");
      switchShop.mutate({ shopId: branch.id });
    },
    onError: (err) => toast({ title: t("header.addBranch"), description: err.message, variant: "destructive" }),
  });

  if (!user.shop) return null;
  const isOwner = user.memberRole === "OWNER";
  const multiple = user.shops.length > 1;

  // Nothing to switch to and not allowed to add: just show where we are.
  if (!multiple && !isOwner) {
    return (
      <div className="mr-auto flex items-center gap-2 text-sm text-slate-600 min-w-0">
        <Store className="h-4 w-4 text-slate-400 shrink-0" />
        <span className="truncate font-medium">{user.shop.name}</span>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="mr-auto flex items-center gap-2 h-9 px-2.5 rounded-xl hover:bg-slate-50 transition-colors min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            <Store className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="truncate text-sm font-medium text-slate-700">{user.shop.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 rounded-xl border-slate-100 shadow-lg shadow-slate-100/80">
          <DropdownMenuLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {multiple ? t("header.switchBranch") : t("header.branch")}
          </DropdownMenuLabel>
          {user.shops.map((shop) => (
            <DropdownMenuItem
              key={shop.id}
              className="rounded-lg mx-1 cursor-pointer"
              disabled={switchShop.isPending}
              onClick={() => shop.id !== user.shop?.id && switchShop.mutate({ shopId: shop.id })}
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{shop.name}</p>
                {user.shops.some((s) => s.businessId !== shop.businessId) && (
                  <p className="truncate text-xs text-slate-400">{shop.businessName}</p>
                )}
              </div>
              {shop.id === user.shop?.id && <Check className="h-4 w-4 text-indigo-600" />}
            </DropdownMenuItem>
          ))}
          {isOwner && (
            <>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem className="rounded-lg mx-1 cursor-pointer" onClick={() => setAdding(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("header.addBranch")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("header.newBranch")}</DialogTitle>
            <DialogDescription>{t("header.branchHint")}</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) addBranch.mutate({ name: name.trim() });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="branch-name">{t("header.branchName")}</Label>
              <Input
                id="branch-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("header.branchNamePlaceholder")}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdding(false)}>
                {t("header.cancel")}
              </Button>
              <Button type="submit" disabled={!name.trim() || addBranch.isPending}>
                {t("header.createBranch")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
