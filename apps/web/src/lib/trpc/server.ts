import { initTRPC, TRPCError } from "@trpc/server";
import type { TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc";
import { cookies } from "next/headers";
import superjson from "superjson";
import { z } from "zod";
import { AUTH_COOKIES, ApiError, apiFetch, type ApiOptions } from "@/server/api";

/**
 * tRPC is a thin backend-for-frontend over the REST API: procedures forward
 * to apps/api with the session's tokens from httpOnly cookies. Authorisation
 * is enforced by the API; the checks here only short-circuit obvious cases.
 */
export async function createContext() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIES.access)?.value ?? null;
  const shopId = store.get(AUTH_COOKIES.shop)?.value ?? null;

  /** Call the API as the signed-in user in the active branch. */
  const api = async <T>(path: string, options: Omit<ApiOptions, "token" | "shopId"> = {}) => {
    try {
      return await apiFetch<T>(path, { ...options, token, shopId });
    } catch (error) {
      throw toTRPCError(error);
    }
  };

  return { token, shopId, cookies: store, api };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const STATUS_TO_CODE: Record<number, TRPC_ERROR_CODE_KEY> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  429: "TOO_MANY_REQUESTS",
  503: "SERVICE_UNAVAILABLE",
};

export function toTRPCError(error: unknown): TRPCError {
  if (error instanceof TRPCError) return error;
  if (error instanceof ApiError) {
    return new TRPCError({
      code: STATUS_TO_CODE[error.status] ?? "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: error });
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof z.ZodError ? z.flattenError(error.cause) : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.token) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx });
});

/** Admin-only UI actions; the API enforces the real owner/manager check. */
export const adminProcedure = protectedProcedure;
