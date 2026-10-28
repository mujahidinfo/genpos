import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure, protectedProcedure, toTRPCError } from "@/lib/trpc/server";
import {
  AUTH_COOKIES,
  apiFetch,
  clearAuthCookies,
  setAuthCookies,
  setShopCookie,
  type AuthResponse,
} from "@/server/api";
import type { Workspace } from "@/server/api-types";

/** Store the new session and pick a branch. Returns whether onboarding is needed. */
async function startSession(
  ctx: { cookies: Parameters<typeof setAuthCookies>[0] },
  auth: AuthResponse,
) {
  setAuthCookies(ctx.cookies, auth);
  const workspaces = await apiFetch<Workspace[]>("/businesses", { token: auth.accessToken });
  const firstShop = workspaces[0]?.shops[0];
  if (firstShop) setShopCookie(ctx.cookies, firstShop.id);
  return { user: auth.user, needsOnboarding: !firstShop };
}

export const authRouter = router({
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      try {
        const auth = await apiFetch<AuthResponse>("/auth/login", { method: "POST", body: input });
        return await startSession(ctx, auth);
      } catch (error) {
        throw toTRPCError(error);
      }
    }),

  register: publicProcedure
    .input(
      z.object({
        name: z.string().trim().min(1),
        email: z.string().email(),
        password: z.string().min(8, "Use at least 8 characters"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const auth = await apiFetch<AuthResponse>("/auth/register", { method: "POST", body: input });
        return await startSession(ctx, auth);
      } catch (error) {
        throw toTRPCError(error);
      }
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    const refreshToken = ctx.cookies.get(AUTH_COOKIES.refresh)?.value;
    if (refreshToken) {
      // Best effort: revoke server-side, sign out locally regardless.
      await apiFetch("/auth/logout", { method: "POST", body: { refreshToken } }).catch(() => {});
    }
    clearAuthCookies(ctx.cookies);
    return { success: true };
  }),

  me: protectedProcedure.query(({ ctx }) =>
    ctx.api<{ id: string; name: string; email: string }>("/auth/me"),
  ),

  /** Onboarding: create the business and its first branch, then work in it. */
  createBusiness: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1),
        phone: z.string().trim().optional(),
        currency: z.string().length(3).default("BDT"),
        language: z.enum(["en", "bn"]).default("bn"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const business = await ctx.api<Workspace>("/businesses", { method: "POST", body: input });
      setShopCookie(ctx.cookies, business.shops[0].id);
      return business;
    }),

  /** Switch the active branch (validated against the user's memberships). */
  switchShop: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const workspaces = await ctx.api<Workspace[]>("/businesses");
      const allowed = workspaces.some((w) => w.shops.some((s) => s.id === input.shopId));
      if (!allowed) throw new TRPCError({ code: "FORBIDDEN", message: "No access to this shop" });
      setShopCookie(ctx.cookies, input.shopId);
      return { success: true };
    }),

  /** Open another branch of the active business (owners only, enforced by the API). */
  addBranch: protectedProcedure
    .input(z.object({ name: z.string().trim().min(1), phone: z.string().trim().optional() }))
    .mutation(({ input, ctx }) =>
      ctx.api<{ id: string; name: string }>("/shops", { method: "POST", body: input }),
    ),
});
