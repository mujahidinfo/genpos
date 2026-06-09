import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "@/lib/trpc/server";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { generateOrderNumber } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export const ordersRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          status: z
            .enum([
              "PENDING",
              "PROCESSING",
              "FULFILLED",
              "CANCELED",
              "REFUNDED",
            ])
            .optional(),
          search: z.string().optional(),
          from: z.date().optional(),
          to: z.date().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(20),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const { status, search, from, to, page = 1, pageSize = 20 } = input ?? {};
      const skip = (page - 1) * pageSize;
      const where: Prisma.OrderWhereInput = {};
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { orderNumber: { contains: search, mode: "insensitive" } },
          { customer: { name: { contains: search, mode: "insensitive" } } },
        ];
      }
      if (from || to) {
        where.createdAt = {};
        if (from) (where.createdAt as Prisma.DateTimeFilter).gte = from;
        if (to) (where.createdAt as Prisma.DateTimeFilter).lte = to;
      }
      const [items, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            customer: true,
            cashier: { select: { id: true, name: true } },
            items: { include: { product: true } },
            refunds: true,
          },
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
        }),
        prisma.order.count({ where }),
      ]);
      return { items, total, page, pageSize };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const order = await prisma.order.findUnique({
        where: { id: input.id },
        include: {
          customer: true,
          cashier: { select: { id: true, name: true } },
          items: { include: { product: true, variant: true } },
          refunds: true,
        },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      return order;
    }),

  create: protectedProcedure
    .input(
      z.object({
        customerId: z.string().optional(),
        type: z.enum(["WALK_IN", "ONLINE"]).default("WALK_IN"),
        items: z
          .array(
            z.object({
              productId: z.string(),
              variantId: z.string().optional(),
              name: z.string(),
              sku: z.string().optional(),
              price: z.number(),
              quantity: z.number().int().positive(),
            }),
          )
          .min(1),
        discountType: z.enum(["percentage", "fixed"]).optional(),
        discountValue: z.number().min(0).default(0),
        taxRate: z.number().min(0).default(0),
        paymentMethod: z
          .enum(["CASH", "CARD", "MOBILE_MONEY", "BANK_TRANSFER"])
          .default("CASH"),
        note: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const subtotal = input.items.reduce(
        (s, i) => s + i.price * i.quantity,
        0,
      );
      let discountAmt = 0;
      if (input.discountType === "percentage")
        discountAmt = subtotal * (input.discountValue / 100);
      else if (input.discountType === "fixed")
        discountAmt = input.discountValue;
      const taxableAmount = subtotal - discountAmt;
      const taxAmt = parseFloat(
        (taxableAmount * (input.taxRate / 100)).toFixed(2),
      );
      const total = parseFloat((taxableAmount + taxAmt).toFixed(2));

      // Deduct stock
      for (const item of input.items) {
        if (item.variantId) {
          const variant = await prisma.productVariant.findUnique({
            where: { id: item.variantId },
          });
          if (!variant || variant.stock < item.quantity) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Insufficient stock for ${item.name}`,
            });
          }
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
          await prisma.stockMovement.create({
            data: {
              productId: item.productId,
              variantId: item.variantId,
              type: "OUT",
              quantity: item.quantity,
              note: "Sale",
            },
          });
        }
      }

      return prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          cashierId: ctx.user.id,
          customerId: input.customerId,
          type: input.type,
          status: "PENDING",
          subtotal,
          discountType: input.discountType,
          discountValue: input.discountValue,
          discountAmt,
          taxRate: input.taxRate,
          taxAmt,
          total,
          paymentMethod: input.paymentMethod,
          note: input.note,
          items: {
            create: input.items.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              name: i.name,
              sku: i.sku,
              price: i.price,
              quantity: i.quantity,
              total: i.price * i.quantity,
            })),
          },
        },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          "PENDING",
          "PROCESSING",
          "FULFILLED",
          "CANCELED",
          "REFUNDED",
        ]),
      }),
    )
    .mutation(async ({ input }) => {
      return prisma.order.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  refund: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        amount: z.number().positive(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const order = await prisma.order.findUniqueOrThrow({
        where: { id: input.orderId },
      });
      const existingRefunds = await prisma.refund.aggregate({
        where: { orderId: input.orderId },
        _sum: { amount: true },
      });
      const totalRefunded = existingRefunds._sum.amount ?? 0;
      if (totalRefunded + input.amount > order.total) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Refund exceeds order total",
        });
      }
      const refund = await prisma.refund.create({ data: input });
      await prisma.order.update({
        where: { id: input.orderId },
        data: { status: "REFUNDED" },
      });
      return refund;
    }),
});
