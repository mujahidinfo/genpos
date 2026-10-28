import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "@/lib/trpc/server";
import type { Paginated, Product, ProductDetail, ScannedProduct } from "@/server/api-types";

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
    .query(({ input, ctx }) => ctx.api<Paginated<Product>>("/products", { query: input })),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => ctx.api<ProductDetail>(`/products/${input.id}`)),

  getByBarcode: protectedProcedure
    .input(z.object({ barcode: z.string() }))
    .query(({ input, ctx }) =>
      ctx.api<ScannedProduct>(`/products/barcode/${encodeURIComponent(input.barcode)}`),
    ),

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
        // Simple products (no variants): opening stock in the active branch.
        stock: z.number().int().optional(),
        lowStock: z.number().int().min(0).optional(),
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
    .mutation(({ input, ctx }) =>
      ctx.api<ProductDetail>("/products", { method: "POST", body: input }),
    ),

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
    .mutation(({ input: { id, ...data }, ctx }) =>
      ctx.api<ProductDetail>(`/products/${id}`, { method: "PATCH", body: data }),
    ),

  adjustStock: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        variantId: z.string().optional(),
        type: z.enum(["IN", "OUT", "ADJUSTMENT", "RETURN"]),
        quantity: z.number().int(),
        note: z.string().optional(),
      }),
    )
    .mutation(({ input: { productId, ...body }, ctx }) =>
      ctx.api<{ variantId: string; stock: number }>(`/products/${productId}/stock`, {
        method: "POST",
        body,
      }),
    ),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) =>
      ctx.api<{ success: boolean }>(`/products/${input.id}`, { method: "DELETE" }),
    ),
});
