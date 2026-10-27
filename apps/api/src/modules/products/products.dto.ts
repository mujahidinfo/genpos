import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationQuery } from '../../common/utils.js';

/** Trimmed optional code; "" from a form field means "none". */
const optionalCode = z
  .string()
  .trim()
  .max(64)
  .optional()
  .transform((v) => v || undefined);

export class ListProductsQueryDto extends createZodDto(
  paginationQuery(20).extend({
    search: z.string().optional(),
    categoryId: z.string().optional(),
    lowStock: z.stringbool().optional(),
  }),
) {}

const variantSchema = z.object({
  name: z.string().trim().min(1),
  sku: optionalCode,
  barcode: optionalCode,
  price: z.number().nonnegative().optional(),
  stock: z.number().int().default(0),
  lowStock: z.number().int().min(0).default(5),
});

export class CreateProductDto extends createZodDto(
  z.object({
    name: z.string().trim().min(1).max(200),
    description: z.string().optional(),
    sku: optionalCode,
    barcode: optionalCode,
    price: z.number().nonnegative(),
    costPrice: z.number().min(0).default(0),
    categoryId: z.string().optional(),
    imageUrl: z.string().optional(),
    // Simple products (no variants): starting stock in the active branch.
    stock: z.number().int().default(0),
    lowStock: z.number().int().min(0).default(5),
    variants: z.array(variantSchema).default([]),
  }),
) {}

export class UpdateProductDto extends createZodDto(
  z.object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().optional(),
    sku: optionalCode,
    barcode: optionalCode,
    price: z.number().nonnegative().optional(),
    costPrice: z.number().min(0).optional(),
    categoryId: z.string().optional(),
    imageUrl: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
) {}

export class AdjustStockDto extends createZodDto(
  z.object({
    // Omit for simple products — the default variant is used.
    variantId: z.string().optional(),
    type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RETURN']),
    quantity: z.number().int(),
    lowStock: z.number().int().min(0).optional(),
    note: z.string().optional(),
  }),
) {}
