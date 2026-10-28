import { z } from "zod";
import type { Refund } from "@genpos/db";
import { router, protectedProcedure } from "@/lib/trpc/server";
import type { OrderDetail, OrderListItem, Paginated } from "@/server/api-types";

const statusSchema = z.enum(["PENDING", "PROCESSING", "FULFILLED", "CANCELED", "REFUNDED"]);

export const ordersRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          status: statusSchema.optional(),
          search: z.string().optional(),
          from: z.date().optional(),
          to: z.date().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(20),
        })
        .optional(),
    )
    .query(({ input, ctx }) => ctx.api<Paginated<OrderListItem>>("/orders", { query: input })),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => ctx.api<OrderDetail>(`/orders/${input.id}`)),

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
              // Sale price is set per line by the cashier (SMEs negotiate prices).
              price: z.number().nonnegative().finite(),
              quantity: z.number().int().positive(),
            }),
          )
          .min(1),
        discountType: z.enum(["percentage", "fixed"]).optional(),
        discountValue: z.number().min(0).default(0),
        taxRate: z.number().min(0).default(0),
        paymentMethod: z.enum(["CASH", "CARD", "MOBILE_MONEY", "BANK_TRANSFER"]).default("CASH"),
        amountTendered: z.number().nonnegative().optional(),
        note: z.string().optional(),
        status: z.enum(["PENDING", "PROCESSING", "FULFILLED"]).default("FULFILLED"),
      }),
    )
    .mutation(({ input, ctx }) => ctx.api<OrderDetail>("/orders", { method: "POST", body: input })),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.string(), status: statusSchema }))
    .mutation(({ input: { id, status }, ctx }) =>
      ctx.api<OrderListItem>(`/orders/${id}/status`, { method: "PATCH", body: { status } }),
    ),

  refund: protectedProcedure
    .input(z.object({ orderId: z.string(), amount: z.number().positive(), reason: z.string().optional() }))
    .mutation(({ input: { orderId, ...body }, ctx }) =>
      ctx.api<Refund>(`/orders/${orderId}/refunds`, { method: "POST", body }),
    ),
});
