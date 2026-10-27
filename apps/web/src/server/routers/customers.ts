import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "@/lib/trpc/server";
import { prisma } from "@/lib/prisma";

export const customersRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const where = input?.search
        ? {
            OR: [
              { name: { contains: input.search, mode: "insensitive" as const } },
              { email: { contains: input.search, mode: "insensitive" as const } },
              { phone: { contains: input.search, mode: "insensitive" as const } },
            ],
          }
        : {};
      return prisma.customer.findMany({
        where,
        include: { _count: { select: { orders: true } } },
        orderBy: { name: "asc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) =>
      prisma.customer.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          orders: {
            orderBy: { createdAt: "desc" },
            take: 10,
            include: { items: true },
          },
        },
      })
    ),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => prisma.customer.create({ data: input })),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.customer.update({ where: { id }, data });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => prisma.customer.delete({ where: { id: input.id } })),

  getByPhone: protectedProcedure
    .input(z.object({ phone: z.string() }))
    .query(async ({ input }) => {
      if (input.phone.trim().length < 4) return null;
      return prisma.customer.findFirst({
        where: { phone: { contains: input.phone.trim() } },
      });
    }),

  findOrCreate: protectedProcedure
    .input(z.object({
      phone: z.string().min(1),
      name: z.string().min(1),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      const existing = await prisma.customer.findFirst({ where: { phone: input.phone } });
      if (existing) return existing;
      return prisma.customer.create({ data: { phone: input.phone, name: input.name, email: input.email } });
    }),
});
