import { z } from "zod";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { router, publicProcedure, protectedProcedure } from "@/lib/trpc/server";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

export const authRouter = router({
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }),
    )
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (!user || !user.isActive) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }
      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await prisma.session.create({
        data: { userId: user.id, token, expiresAt },
      });

      const cookieStore = await cookies();
      cookieStore.set("session_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
        path: "/",
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (token) {
      await prisma.session.deleteMany({ where: { token } });
      cookieStore.delete("session_token");
    }
    return { success: true };
  }),

  me: protectedProcedure.query(({ ctx }) => ctx.user),
});
