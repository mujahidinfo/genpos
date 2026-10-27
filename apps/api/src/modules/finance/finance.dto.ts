import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  daysQuerySchema,
  isoDate,
  paginationQuery,
  paymentMethodSchema,
} from '../../common/utils.js';

const expenseStatusSchema = z.enum(['PAID', 'PENDING', 'CANCELLED']);
const salaryTypeSchema = z.enum(['MONTHLY', 'HOURLY', 'WEEKLY', 'ANNUALLY']);
const budgetPeriodSchema = z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']);

// ─── Overview & reports ──────────────────────────────────────────────────────

export class FinanceOverviewQueryDto extends createZodDto(daysQuerySchema) {}

export class FinanceReportQueryDto extends createZodDto(
  z.object({
    from: isoDate,
    to: isoDate,
    type: z.enum(['income_statement', 'expense', 'employee_salary']),
    categoryId: z.string().optional(),
  }),
) {}

// ─── Expense categories ──────────────────────────────────────────────────────

export class CreateExpenseCategoryDto extends createZodDto(
  z.object({
    name: z.string().min(1),
    color: z.string().default('#6366f1'),
  }),
) {}

export class UpdateExpenseCategoryDto extends createZodDto(
  z.object({
    name: z.string().min(1).optional(),
    color: z.string().optional(),
  }),
) {}

// ─── Expenses ────────────────────────────────────────────────────────────────

export class ListExpensesQueryDto extends createZodDto(
  paginationQuery(15).extend({
    categoryId: z.string().optional(),
    employeeId: z.string().optional(),
    status: expenseStatusSchema.optional(),
    paymentMethod: paymentMethodSchema.optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    search: z.string().optional(),
  }),
) {}

export class CreateExpenseDto extends createZodDto(
  z.object({
    title: z.string().min(1),
    amount: z.number().positive(),
    date: isoDate,
    categoryId: z.string(),
    employeeId: z.string().optional(),
    paymentMethod: paymentMethodSchema.default('CASH'),
    status: expenseStatusSchema.default('PAID'),
    isRecurring: z.boolean().default(false),
    notes: z.string().optional(),
  }),
) {}

export class UpdateExpenseDto extends createZodDto(
  z.object({
    title: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    date: isoDate.optional(),
    categoryId: z.string().optional(),
    employeeId: z.string().nullable().optional(),
    paymentMethod: paymentMethodSchema.optional(),
    status: expenseStatusSchema.optional(),
    isRecurring: z.boolean().optional(),
    notes: z.string().optional(),
  }),
) {}

// ─── Employees ───────────────────────────────────────────────────────────────

export class CreateEmployeeDto extends createZodDto(
  z.object({
    name: z.string().min(1),
    email: z.email().optional().or(z.literal('')),
    phone: z.string().optional(),
    position: z.string().min(1),
    salary: z.number().positive(),
    salaryType: salaryTypeSchema.default('MONTHLY'),
    joinDate: isoDate,
    notes: z.string().optional(),
  }),
) {}

export class UpdateEmployeeDto extends createZodDto(
  z.object({
    name: z.string().min(1).optional(),
    email: z.email().nullable().optional(),
    phone: z.string().nullable().optional(),
    position: z.string().min(1).optional(),
    salary: z.number().positive().optional(),
    salaryType: salaryTypeSchema.optional(),
    joinDate: isoDate.optional(),
    isActive: z.boolean().optional(),
    notes: z.string().nullable().optional(),
  }),
) {}

// ─── Budgets ─────────────────────────────────────────────────────────────────

export class CreateBudgetDto extends createZodDto(
  z.object({
    name: z.string().min(1),
    amount: z.number().positive(),
    period: budgetPeriodSchema.default('MONTHLY'),
    startDate: isoDate,
    endDate: isoDate.optional(),
    categoryId: z.string().optional(),
  }),
) {}

export class UpdateBudgetDto extends createZodDto(
  z.object({
    name: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    period: budgetPeriodSchema.optional(),
    startDate: isoDate.optional(),
    endDate: isoDate.nullable().optional(),
    categoryId: z.string().nullable().optional(),
  }),
) {}
