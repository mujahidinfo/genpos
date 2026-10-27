import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  isoDate,
  paginationQuery,
  paymentMethodSchema,
} from '../../common/utils.js';

const orderStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'FULFILLED',
  'CANCELED',
  'REFUNDED',
]);

export class ListOrdersQueryDto extends createZodDto(
  paginationQuery(20).extend({
    status: orderStatusSchema.optional(),
    search: z.string().optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
  }),
) {}

export class CreateOrderDto extends createZodDto(
  z.object({
    customerId: z.string().optional(),
    type: z.enum(['WALK_IN', 'ONLINE']).default('WALK_IN'),
    items: z
      .array(
        z.object({
          productId: z.string(),
          variantId: z.string().optional(),
          name: z.string(),
          sku: z.string().optional(),
          // Sale price is set per line by the cashier (SMEs negotiate prices),
          // so it is deliberately not checked against the catalogue price —
          // but it must still be a sane, non-negative amount.
          price: z.number().nonnegative().finite(),
          quantity: z.number().int().positive(),
        }),
      )
      .min(1),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    discountValue: z.number().min(0).default(0),
    taxRate: z.number().min(0).default(0),
    paymentMethod: paymentMethodSchema.default('CASH'),
    note: z.string().optional(),
    // A POS sale is complete the moment it is rung up, so it defaults to
    // FULFILLED. Callers that genuinely need a queue (e.g. online orders
    // awaiting delivery) can still pass PENDING.
    status: z.enum(['PENDING', 'PROCESSING', 'FULFILLED']).default('FULFILLED'),
  }),
) {}

export class UpdateOrderStatusDto extends createZodDto(
  z.object({ status: orderStatusSchema }),
) {}

export class CreateRefundDto extends createZodDto(
  z.object({
    amount: z.number().positive(),
    reason: z.string().optional(),
  }),
) {}
