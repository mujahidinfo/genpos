import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationQuery, paymentMethodSchema } from '../../common/utils.js';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined);

const supplierSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: optionalText(30),
  email: z
    .email()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  address: optionalText(200),
  notes: optionalText(500),
});

export class ListSuppliersQueryDto extends createZodDto(
  z.object({
    search: z.string().optional(),
    includeInactive: z.stringbool().optional(),
  }),
) {}

export class CreateSupplierDto extends createZodDto(supplierSchema) {}

export class UpdateSupplierDto extends createZodDto(
  supplierSchema.partial().extend({ isActive: z.boolean().optional() }),
) {}

export class CreateSupplierPaymentDto extends createZodDto(
  z.object({
    amount: z.number().positive().finite(),
    paymentMethod: paymentMethodSchema.default('CASH'),
    note: optionalText(200),
  }),
) {}

export class ReorderQueryDto extends createZodDto(
  z.object({
    // Only items last bought from this supplier.
    supplierId: z.string().optional(),
  }),
) {}

export class ListPurchasesQueryDto extends createZodDto(
  paginationQuery(20).extend({
    supplierId: z.string().optional(),
  }),
) {}

export class CreatePurchaseDto extends createZodDto(
  z.object({
    supplierId: z.string().optional(),
    items: z
      .array(
        z.object({
          productId: z.string(),
          // Omit for simple products — the default variant is used.
          variantId: z.string().optional(),
          quantity: z.number().int().positive(),
          unitCost: z.number().nonnegative().finite(),
        }),
      )
      .min(1),
    // Paid to the supplier now; the rest is owed (supplier balance).
    paidAmount: z.number().nonnegative().finite().default(0),
    paymentMethod: paymentMethodSchema.default('CASH'),
    // Keep the product's cost price in step with what was just paid.
    updateCostPrice: z.boolean().default(true),
    note: optionalText(500),
  }),
) {}
