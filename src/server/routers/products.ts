import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "@/lib/trpc/server";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";

export const productsRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          categoryId: z.string().optional(),
          lowStock: z.boolean().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(20),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const {
        search,
        categoryId,
        lowStock,
        page = 1,
        pageSize = 20,
      } = input ?? {};
      const skip = (page - 1) * pageSize;

      const where: Prisma.ProductWhereInput = { isActive: true };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { barcode: { contains: search, mode: "insensitive" } },
        ];
      }
      if (categoryId) where.categoryId = categoryId;

      const [items, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true,
            variants: true,
            _count: { select: { orderItems: true } },
          },
          skip,
          take: pageSize,
          orderBy: { name: "asc" },
        }),
        prisma.product.count({ where }),
      ]);

      // Filter low stock after join
      const filteredItems = lowStock
        ? items.filter((p) => p.variants.some((v) => v.stock <= v.lowStock))
        : items;

      return { items: filteredItems, total, page, pageSize };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const product = await prisma.product.findUnique({
        where: { id: input.id },
        include: {
          category: true,
          variants: true,
          stockMovements: { orderBy: { createdAt: "desc" }, take: 20 },
        },
      });
      if (!product) throw new TRPCError({ code: "NOT_FOUND" });
      return product;
    }),

  getByBarcode: protectedProcedure
    .input(z.object({ barcode: z.string() }))
    .query(async ({ input }) => {
      const product = await prisma.product.findFirst({
        where: {
          OR: [
            { barcode: input.barcode },
            { variants: { some: { barcode: input.barcode } } },
          ],
        },
        include: { category: true, variants: true },
      });
      if (!product) throw new TRPCError({ code: "NOT_FOUND" });
      return product;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        sku: z.string().optional(),
        barcode: z.string().optional(),
        price: z.number().positive(),
        costPrice: z.number().min(0).default(0),
        categoryId: z.string().optional(),
        imageUrl: z.string().optional(),
        variants: z
          .array(
            z.object({
              name: z.string(),
              sku: z.string().optional(),
              barcode: z.string().optional(),
              price: z.number().optional(),
              stock: z.number().int().min(0).default(0),
              lowStock: z.number().int().min(0).default(5),
            }),
          )
          .default([]),
      }),
    )
    .mutation(async ({ input }) => {
      const { variants, ...productData } = input;
      return prisma.product.create({
        data: {
          ...productData,
          variants: variants.length > 0 ? { create: variants } : undefined,
        },
        include: { category: true, variants: true },
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        sku: z.string().optional(),
        barcode: z.string().optional(),
        price: z.number().positive().optional(),
        costPrice: z.number().min(0).optional(),
        categoryId: z.string().optional(),
        imageUrl: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.product.update({
        where: { id },
        data,
        include: { category: true, variants: true },
      });
    }),

  adjustStock: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        variantId: z.string(),
        type: z.enum(["IN", "OUT", "ADJUSTMENT", "RETURN"]),
        quantity: z.number().int(),
        note: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const variant = await prisma.productVariant.findUniqueOrThrow({
        where: { id: input.variantId },
      });
      let newStock = variant.stock;
      if (input.type === "IN" || input.type === "RETURN")
        newStock += input.quantity;
      else if (input.type === "OUT") newStock -= input.quantity;
      else newStock = input.quantity; // ADJUSTMENT = set absolute

      if (newStock < 0)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient stock",
        });

      await prisma.productVariant.update({
        where: { id: input.variantId },
        data: { stock: newStock },
      });
      await prisma.stockMovement.create({
        data: {
          productId: input.productId,
          variantId: input.variantId,
          type: input.type,
          quantity: input.quantity,
          note: input.note,
        },
      });
      return { stock: newStock };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) =>
      prisma.product.update({
        where: { id: input.id },
        data: { isActive: false },
      }),
    ),
});
