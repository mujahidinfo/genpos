import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "@/lib/trpc/server";
import { prisma } from "@/lib/prisma";

export const shopRouter = router({
  get: protectedProcedure.query(async () => {
    const shop = await prisma.shop.findFirst();
    return shop;
  }),

  update: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        logo: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        currency: z.string().default("USD"),
        taxRate: z.number().min(0).max(100).default(0),
        taxName: z.string().default("Tax"),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await prisma.shop.findFirst();
      if (existing) {
        return prisma.shop.update({ where: { id: existing.id }, data: input });
      }
      return prisma.shop.create({ data: input });
    }),
});
