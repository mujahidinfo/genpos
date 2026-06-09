import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { getSession, type AuthUser } from "@/lib/auth";

export type Context = {
  user: AuthUser | null;
};

export async function createContext(): Promise<Context> {
  const user = await getSession();
  return { user };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof z.ZodError
            ? z.flattenError(error.cause)
            : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});
