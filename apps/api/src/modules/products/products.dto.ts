import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationQuery } from '../../common/utils.js';

export class ListProductsQueryDto extends createZodDto(
  paginationQuery(20).extend({
    search: z.string().optional(),
    categoryId: z.string().optional(),
    lowStock: z.stringbool().optional(),
  }),
) {}

const variantSchema = z.object({
  name: z.string(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  price: z.number().optional(),
  stock: z.number().int().min(0).default(0),
  lowStock: z.number().int().min(0).default(5),
});

export class CreateProductDto extends createZodDto(
  z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    price: z.number().positive(),
    costPrice: z.number().min(0).default(0),
    categoryId: z.string().optional(),
    imageUrl: z.string().optional(),
    variants: z.array(variantSchema).default([]),
  }),
) {}

export class UpdateProductDto extends createZodDto(
  z.object({
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
) {}

export class AdjustStockDto extends createZodDto(
  z.object({
    variantId: z.string(),
    type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RETURN']),
    quantity: z.number().int(),
    note: z.string().optional(),
  }),
) {}
