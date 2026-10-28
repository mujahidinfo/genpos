import { z } from "zod";
import type { Budget, Employee, Expense, ExpenseCategory } from "@genpos/db";
import { router, adminProcedure } from "@/lib/trpc/server";
import type {
  BudgetWithSpend,
  EmployeeWithCount,
  ExpenseCategoryWithCount,
  ExpenseListItem,
  ExpenseWithRelations,
  FinanceOverview,
  FinanceReport,
} from "@/server/api-types";

const paymentMethod = z.enum(["CASH", "CARD", "MOBILE_MONEY", "BANK_TRANSFER"]);
const expenseStatus = z.enum(["PAID", "PENDING", "CANCELLED"]);
const salaryType = z.enum(["MONTHLY", "HOURLY", "WEEKLY", "ANNUALLY"]);
const budgetPeriod = z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]);
const byId = z.object({ id: z.string() });

// ─── Expense categories ───────────────────────────────────────────────────────

const expenseCategoriesRouter = router({
  list: adminProcedure.query(({ ctx }) =>
    ctx.api<ExpenseCategoryWithCount[]>("/finance/expense-categories"),
  ),

  create: adminProcedure
    .input(z.object({ name: z.string().min(1), color: z.string().default("#6366f1") }))
    .mutation(({ input, ctx }) =>
      ctx.api<ExpenseCategory>("/finance/expense-categories", { method: "POST", body: input }),
    ),

  update: adminProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1).optional(), color: z.string().optional() }))
    .mutation(({ input: { id, ...data }, ctx }) =>
      ctx.api<ExpenseCategory>(`/finance/expense-categories/${id}`, { method: "PATCH", body: data }),
    ),

  delete: adminProcedure
    .input(byId)
    .mutation(({ input, ctx }) =>
      ctx.api<ExpenseCategory>(`/finance/expense-categories/${input.id}`, { method: "DELETE" }),
    ),
});

// ─── Expenses ────────────────────────────────────────────────────────────────

const expensesRouter = router({
  list: adminProcedure
    .input(
      z
        .object({
          page: z.number().default(1),
          pageSize: z.number().default(15),
          categoryId: z.string().optional(),
          employeeId: z.string().optional(),
          status: expenseStatus.optional(),
          paymentMethod: paymentMethod.optional(),
          from: z.date().optional(),
          to: z.date().optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(({ input, ctx }) =>
      ctx.api<{ items: ExpenseListItem[]; total: number; pages: number }>("/finance/expenses", {
        query: input,
      }),
    ),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        amount: z.number().positive(),
        date: z.date(),
        categoryId: z.string(),
        employeeId: z.string().optional(),
        paymentMethod: paymentMethod.default("CASH"),
        status: expenseStatus.default("PAID"),
        isRecurring: z.boolean().default(false),
        notes: z.string().optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      ctx.api<ExpenseWithRelations>("/finance/expenses", { method: "POST", body: input }),
    ),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        amount: z.number().positive().optional(),
        date: z.date().optional(),
        categoryId: z.string().optional(),
        employeeId: z.string().nullable().optional(),
        paymentMethod: paymentMethod.optional(),
        status: expenseStatus.optional(),
        isRecurring: z.boolean().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(({ input: { id, ...data }, ctx }) =>
      ctx.api<ExpenseWithRelations>(`/finance/expenses/${id}`, { method: "PATCH", body: data }),
    ),

  delete: adminProcedure
    .input(byId)
    .mutation(({ input, ctx }) => ctx.api<Expense>(`/finance/expenses/${input.id}`, { method: "DELETE" })),
});

// ─── Employees ───────────────────────────────────────────────────────────────

const employeesRouter = router({
  list: adminProcedure.query(({ ctx }) =>
    ctx.api<{ items: EmployeeWithCount[]; totalMonthlySalary: number }>("/finance/employees"),
  ),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        position: z.string().min(1),
        salary: z.number().positive(),
        salaryType: salaryType.default("MONTHLY"),
        joinDate: z.date(),
        notes: z.string().optional(),
      }),
    )
    .mutation(({ input, ctx }) => ctx.api<Employee>("/finance/employees", { method: "POST", body: input })),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().nullable().optional(),
        phone: z.string().nullable().optional(),
        position: z.string().min(1).optional(),
        salary: z.number().positive().optional(),
        salaryType: salaryType.optional(),
        joinDate: z.date().optional(),
        isActive: z.boolean().optional(),
        notes: z.string().nullable().optional(),
      }),
    )
    .mutation(({ input: { id, ...data }, ctx }) =>
      ctx.api<Employee>(`/finance/employees/${id}`, { method: "PATCH", body: data }),
    ),
});

// ─── Budget ───────────────────────────────────────────────────────────────────

const budgetRouter = router({
  list: adminProcedure.query(({ ctx }) => ctx.api<BudgetWithSpend[]>("/finance/budgets")),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        amount: z.number().positive(),
        period: budgetPeriod.default("MONTHLY"),
        startDate: z.date(),
        endDate: z.date().optional(),
        categoryId: z.string().optional(),
      }),
    )
    .mutation(({ input, ctx }) => ctx.api<Budget>("/finance/budgets", { method: "POST", body: input })),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        amount: z.number().positive().optional(),
        period: budgetPeriod.optional(),
        startDate: z.date().optional(),
        endDate: z.date().nullable().optional(),
        categoryId: z.string().nullable().optional(),
      }),
    )
    .mutation(({ input: { id, ...data }, ctx }) =>
      ctx.api<Budget>(`/finance/budgets/${id}`, { method: "PATCH", body: data }),
    ),

  delete: adminProcedure
    .input(byId)
    .mutation(({ input, ctx }) => ctx.api<Budget>(`/finance/budgets/${input.id}`, { method: "DELETE" })),
});

// ─── Main Finance Router ──────────────────────────────────────────────────────

export const financeRouter = router({
  overview: adminProcedure
    .input(z.object({ days: z.number().default(30) }).optional())
    .query(({ input, ctx }) => ctx.api<FinanceOverview>("/finance/overview", { query: input })),

  expenseCategories: expenseCategoriesRouter,
  expenses: expensesRouter,
  employees: employeesRouter,
  budget: budgetRouter,

  report: adminProcedure
    .input(
      z.object({
        from: z.date(),
        to: z.date(),
        type: z.enum(["income_statement", "expense", "employee_salary"]),
        categoryId: z.string().optional(),
      }),
    )
    .query(({ input, ctx }) => ctx.api<FinanceReport>("/finance/report", { query: input })),
});
