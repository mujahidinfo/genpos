import { z } from "zod";
import type { Category } from "@genpos/db";
import { router, protectedProcedure, adminProcedure } from "@/lib/trpc/server";
import type { CategoryWithCount } from "@/server/api-types";

export const categoriesRouter = router({
  list: protectedProcedure.query(({ ctx }) => ctx.api<CategoryWithCount[]>("/categories")),

  create: adminProcedure
    .input(z.object({ name: z.string().min(1), description: z.string().optional(), color: z.string().optional() }))
    .mutation(({ input, ctx }) => ctx.api<Category>("/categories", { method: "POST", body: input })),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        color: z.string().optional(),
      }),
    )
    .mutation(({ input: { id, ...data }, ctx }) =>
      ctx.api<Category>(`/categories/${id}`, { method: "PATCH", body: data }),
    ),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => ctx.api<Category>(`/categories/${input.id}`, { method: "DELETE" })),
});
