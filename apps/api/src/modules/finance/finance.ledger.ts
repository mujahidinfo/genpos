import type { Prisma } from '@genpos/db';

/**
 * Categories the app creates for money that leaves the business automatically,
 * so those payments sit in the same ledger as everything else.
 */
export const STOCK_CATEGORY = { name: 'Stock purchases', color: '#0ea5e9' };
export const SALARY_CATEGORY = { name: 'Salary', color: '#10b981' };

export function ensureExpenseCategory(
  db: Prisma.TransactionClient,
  businessId: string,
  category: { name: string; color: string },
) {
  return db.expenseCategory.upsert({
    where: { businessId_name: { businessId, name: category.name } },
    update: {},
    create: { businessId, ...category },
  });
}

/** "2026-10" — identifies the salary month an expense pays for. */
export const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
