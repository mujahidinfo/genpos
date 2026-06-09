import { z } from "zod";
import bcrypt from "bcryptjs";
import { router, adminProcedure, protectedProcedure } from "@/lib/trpc/server";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";

export const usersRouter = router({
  list: adminProcedure.query(async () => {
    return prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["ADMIN", "CASHIER", "INVENTORY_MANAGER"]),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Email already in use" });
      const passwordHash = await bcrypt.hash(input.password, 12);
      return prisma.user.create({
        data: { name: input.name, email: input.email, passwordHash, role: input.role },
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        role: z.enum(["ADMIN", "CASHIER", "INVENTORY_MANAGER"]).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.id === ctx.user.id && input.isActive === false) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot deactivate yourself" });
      }
      const { id, ...data } = input;
      return prisma.user.update({
        where: { id },
        data,
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await prisma.user.findUniqueOrThrow({ where: { id: ctx.user.id } });
      const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password incorrect" });
      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await prisma.user.update({ where: { id: ctx.user.id }, data: { passwordHash } });
      return { success: true };
    }),
});
