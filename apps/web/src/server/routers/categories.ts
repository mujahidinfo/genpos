import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "@/lib/trpc/server";
import { prisma } from "@/lib/prisma";

export const categoriesRouter = router({
  list: protectedProcedure.query(async () => {
    return prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
  }),

  create: adminProcedure
    .input(z.object({ name: z.string().min(1), description: z.string().optional(), color: z.string().optional() }))
    .mutation(async ({ input }) => prisma.category.create({ data: input })),

  update: adminProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1).optional(), description: z.string().optional(), color: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.category.update({ where: { id }, data });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => prisma.category.delete({ where: { id: input.id } })),
});
