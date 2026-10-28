import { z } from "zod";
import type { MemberRole } from "@genpos/db";
import { router, adminProcedure, protectedProcedure } from "@/lib/trpc/server";
import { toWebRole, type WebRole } from "@/lib/auth";
import type { Member } from "@/server/api-types";

/**
 * The web settings screen still speaks the original three roles; staff are
 * API memberships. "Admin" maps to Manager, and an Owner stays an Owner.
 */
const webRole = z.enum(["ADMIN", "CASHIER", "INVENTORY_MANAGER"]);

function toMemberRole(role: WebRole, current?: MemberRole): MemberRole {
  if (role === "ADMIN") return current === "OWNER" ? "OWNER" : "MANAGER";
  return role;
}

/** The user row shape the settings UI was built for (id = membership id). */
const toWebUser = (m: Member) => ({
  id: m.id,
  name: m.user.name,
  email: m.user.email,
  role: toWebRole(m.role),
  isActive: m.isActive,
  createdAt: m.createdAt,
});

export const usersRouter = router({
  list: adminProcedure.query(async ({ ctx }) =>
    (await ctx.api<Member[]>("/members")).map(toWebUser),
  ),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8, "Use at least 8 characters"),
        role: webRole,
      }),
    )
    .mutation(async ({ input, ctx }) =>
      toWebUser(
        await ctx.api<Member>("/members", {
          method: "POST",
          body: { ...input, role: toMemberRole(input.role) },
        }),
      ),
    ),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        role: webRole.optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const current = input.role
        ? (await ctx.api<Member[]>("/members")).find((m) => m.id === input.id)
        : undefined;
      return toWebUser(
        await ctx.api<Member>(`/members/${input.id}`, {
          method: "PATCH",
          body: {
            isActive: input.isActive,
            ...(input.role && { role: toMemberRole(input.role, current?.role) }),
          },
        }),
      );
    }),

  changePassword: protectedProcedure
    .input(z.object({ currentPassword: z.string(), newPassword: z.string().min(8, "Use at least 8 characters") }))
    .mutation(({ input, ctx }) =>
      ctx.api<{ success: boolean }>("/auth/password", { method: "PATCH", body: input }),
    ),
});
