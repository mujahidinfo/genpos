import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { MemberRole } from "@genpos/db";
import { AUTH_COOKIES, ApiError, apiFetch } from "@/server/api";
import type { ShopSummary, Workspace } from "@/server/api-types";

/** The web UI's three permission levels. Owners and managers act as ADMIN. */
export type WebRole = "ADMIN" | "CASHIER" | "INVENTORY_MANAGER";

export type ActiveShop = ShopSummary & { businessId: string; businessName: string };

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: WebRole;
  memberRole: MemberRole;
  /** The branch this session works in; null until onboarding creates one. */
  shop: ActiveShop | null;
  /** Every branch the user can switch to, across businesses. */
  shops: ActiveShop[];
};

export function toWebRole(role: MemberRole): WebRole {
  return role === "OWNER" || role === "MANAGER" ? "ADMIN" : role;
}

/** Signed-in user + active branch, or null. Deduplicated per request. */
export const getSession = cache(async (): Promise<AuthUser | null> => {
  const store = await cookies();
  const token = store.get(AUTH_COOKIES.access)?.value;
  if (!token) return null;

  let me: { id: string; name: string; email: string };
  let workspaces: Workspace[];
  try {
    [me, workspaces] = await Promise.all([
      apiFetch<{ id: string; name: string; email: string }>("/auth/me", { token }),
      apiFetch<Workspace[]>("/businesses", { token }),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }

  const shops = workspaces.flatMap((w) =>
    w.shops.map((s) => ({ ...s, businessId: w.id, businessName: w.name, role: w.role })),
  );
  const wanted = store.get(AUTH_COOKIES.shop)?.value;
  const active = shops.find((s) => s.id === wanted) ?? shops[0] ?? null;

  return {
    id: me.id,
    name: me.name,
    email: me.email,
    memberRole: active?.role ?? "CASHIER",
    role: toWebRole(active?.role ?? "CASHIER"),
    shop: active && {
      id: active.id,
      name: active.name,
      address: active.address,
      businessId: active.businessId,
      businessName: active.businessName,
    },
    shops: shops.map(({ role: _role, ...s }) => s),
  };
});

/** Server-side guard for dashboard pages. */
export async function requireAuth(requiredRole?: WebRole[]): Promise<AuthUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!user.shop) redirect("/onboarding");
  if (requiredRole && !requiredRole.includes(user.role)) redirect("/dashboard");
  return user;
}

export function canAccess(userRole: WebRole, allowedRoles: WebRole[]): boolean {
  return allowedRoles.includes(userRole);
}
