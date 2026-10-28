import { z } from 'zod';

/** Round a money amount to 2 decimal places. */
export const round2 = (n: number) => parseFloat(n.toFixed(2));

function documentNumber(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export const generateOrderNumber = () => documentNumber('ORD');
export const generatePurchaseNumber = () => documentNumber('PUR');

// ─── Shared zod pieces ───────────────────────────────────────────────────────

export const paymentMethodSchema = z.enum([
  'CASH',
  'CARD',
  'MOBILE_MONEY',
  'BANK_TRANSFER',
]);

/**
 * ISO date ("2026-10-27") or datetime ("2026-10-27T10:00:00Z") string → Date.
 * Used instead of z.coerce.date() so the OpenAPI schema can describe it.
 */
export const isoDate = z
  .union([z.iso.date(), z.iso.datetime({ offset: true })])
  .transform((s) => new Date(s));

/** Query-string pagination (values arrive as strings). */
export const paginationQuery = (defaultPageSize = 20) =>
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(defaultPageSize),
  });

/** `?days=30` style query param. */
export const daysQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(3650).default(30),
});
