import { z } from "zod";
import { router, adminProcedure } from "@/lib/trpc/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subDays,
  subMonths,
  format,
  eachMonthOfInterval,
} from "date-fns";

// ─── Expense Categories ───────────────────────────────────────────────────────

const expenseCategoriesRouter = router({
  list: adminProcedure.query(async () => {
    return prisma.expenseCategory.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { expenses: true } } },
    });
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        color: z.string().default("#6366f1"),
      }),
    )
    .mutation(async ({ input }) => {
      const existing = await prisma.expenseCategory.findUnique({
        where: { name: input.name },
      });
      if (existing)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Category already exists",
        });
      return prisma.expenseCategory.create({ data: input });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.expenseCategory.update({ where: { id }, data });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const count = await prisma.expense.count({
        where: { categoryId: input.id },
      });
      if (count > 0)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete: ${count} expense(s) use this category`,
        });
      return prisma.expenseCategory.delete({ where: { id: input.id } });
    }),
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
          status: z.enum(["PAID", "PENDING", "CANCELLED"]).optional(),
          paymentMethod: z
            .enum(["CASH", "CARD", "MOBILE_MONEY", "BANK_TRANSFER"])
            .optional(),
          from: z.date().optional(),
          to: z.date().optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 15;
      const skip = (page - 1) * pageSize;

      const where: Prisma.ExpenseWhereInput = {
        ...(input?.categoryId && { categoryId: input.categoryId }),
        ...(input?.employeeId && { employeeId: input.employeeId }),
        ...(input?.status && { status: input.status }),
        ...(input?.paymentMethod && { paymentMethod: input.paymentMethod }),
        ...((input?.from || input?.to) && {
          date: {
            ...(input?.from && { gte: startOfDay(input.from) }),
            ...(input?.to && { lte: endOfDay(input.to) }),
          },
        }),
        ...(input?.search && {
          OR: [
            { title: { contains: input.search, mode: "insensitive" as const } },
            { notes: { contains: input.search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [items, total] = await Promise.all([
        prisma.expense.findMany({
          where,
          include: {
            category: true,
            employee: { select: { id: true, name: true, position: true } },
          },
          orderBy: { date: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.expense.count({ where }),
      ]);

      return { items, total, pages: Math.ceil(total / pageSize) };
    }),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        amount: z.number().positive(),
        date: z.date(),
        categoryId: z.string(),
        employeeId: z.string().optional(),
        paymentMethod: z
          .enum(["CASH", "CARD", "MOBILE_MONEY", "BANK_TRANSFER"])
          .default("CASH"),
        status: z.enum(["PAID", "PENDING", "CANCELLED"]).default("PAID"),
        isRecurring: z.boolean().default(false),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return prisma.expense.create({
        data: input,
        include: { category: true, employee: true },
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        amount: z.number().positive().optional(),
        date: z.date().optional(),
        categoryId: z.string().optional(),
        employeeId: z.string().nullable().optional(),
        paymentMethod: z
          .enum(["CASH", "CARD", "MOBILE_MONEY", "BANK_TRANSFER"])
          .optional(),
        status: z.enum(["PAID", "PENDING", "CANCELLED"]).optional(),
        isRecurring: z.boolean().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.expense.update({
        where: { id },
        data,
        include: { category: true, employee: true },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.expense.delete({ where: { id: input.id } });
    }),
});

// ─── Employees ───────────────────────────────────────────────────────────────

const employeesRouter = router({
  list: adminProcedure.query(async () => {
    const employees = await prisma.employee.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: { _count: { select: { expenses: true } } },
    });

    const totalMonthlySalary = employees
      .filter((e) => e.isActive)
      .reduce((sum, e) => sum + toMonthlySalary(e.salary, e.salaryType), 0);

    return { items: employees, totalMonthlySalary };
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        position: z.string().min(1),
        salary: z.number().positive(),
        salaryType: z
          .enum(["MONTHLY", "HOURLY", "WEEKLY", "ANNUALLY"])
          .default("MONTHLY"),
        joinDate: z.date(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const email = input.email || undefined;
      if (email) {
        const existing = await prisma.employee.findUnique({
          where: { email },
        });
        if (existing)
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already in use",
          });
      }
      return prisma.employee.create({ data: { ...input, email } });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().nullable().optional(),
        phone: z.string().nullable().optional(),
        position: z.string().min(1).optional(),
        salary: z.number().positive().optional(),
        salaryType: z
          .enum(["MONTHLY", "HOURLY", "WEEKLY", "ANNUALLY"])
          .optional(),
        joinDate: z.date().optional(),
        isActive: z.boolean().optional(),
        notes: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.employee.update({ where: { id }, data });
    }),
});

// ─── Budget ───────────────────────────────────────────────────────────────────

const budgetRouter = router({
  list: adminProcedure.query(async () => {
    const budgets = await prisma.budget.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return Promise.all(
      budgets.map(async (budget) => {
        const { from, to } = getBudgetDateRange(budget.period, budget.startDate, budget.endDate);

        const result = await prisma.expense.aggregate({
          where: {
            date: { gte: from, lte: to },
            status: { not: "CANCELLED" },
            ...(budget.categoryId && { categoryId: budget.categoryId }),
          },
          _sum: { amount: true },
        });

        const spent = result._sum.amount ?? 0;
        const percentage = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;

        return { ...budget, spent, percentage };
      }),
    );
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        amount: z.number().positive(),
        period: z
          .enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"])
          .default("MONTHLY"),
        startDate: z.date(),
        endDate: z.date().optional(),
        categoryId: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return prisma.budget.create({
        data: input,
        include: { category: true },
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        amount: z.number().positive().optional(),
        period: z
          .enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"])
          .optional(),
        startDate: z.date().optional(),
        endDate: z.date().nullable().optional(),
        categoryId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.budget.update({
        where: { id },
        data,
        include: { category: true },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.budget.delete({ where: { id: input.id } });
    }),
});

// ─── Main Finance Router ──────────────────────────────────────────────────────

export const financeRouter = router({
  overview: adminProcedure
    .input(z.object({ days: z.number().default(30) }).optional())
    .query(async ({ input }) => {
      const days = input?.days ?? 30;
      const from = startOfDay(subDays(new Date(), days - 1));
      const to = endOfDay(new Date());

      const [
        expenseSummary,
        incomeSummary,
        employeeCount,
        budgetCount,
        recentExpenses,
        expensesByCategory,
      ] = await Promise.all([
        prisma.expense.aggregate({
          where: { date: { gte: from, lte: to }, status: { not: "CANCELLED" } },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.order.aggregate({
          where: { status: "FULFILLED", createdAt: { gte: from, lte: to } },
          _sum: { total: true },
          _count: true,
        }),
        prisma.employee.count({ where: { isActive: true } }),
        prisma.budget.count(),
        prisma.expense.findMany({
          where: { status: { not: "CANCELLED" } },
          include: { category: true },
          orderBy: { date: "desc" },
          take: 6,
        }),
        prisma.expense.groupBy({
          by: ["categoryId"],
          where: { date: { gte: from, lte: to }, status: { not: "CANCELLED" } },
          _sum: { amount: true },
        }),
      ]);

      const catIds = expensesByCategory.map((e) => e.categoryId);
      const categories = await prisma.expenseCategory.findMany({
        where: { id: { in: catIds } },
      });
      const catMap = new Map(categories.map((c) => [c.id, c]));

      const expensesByCat = expensesByCategory
        .map((e) => ({
          categoryId: e.categoryId,
          name: catMap.get(e.categoryId)?.name ?? "Unknown",
          color: catMap.get(e.categoryId)?.color ?? "#6366f1",
          amount: parseFloat((e._sum.amount ?? 0).toFixed(2)),
        }))
        .sort((a, b) => b.amount - a.amount);

      const monthlyTrend = await getMonthlyTrend();

      return {
        totalExpenses: parseFloat((expenseSummary._sum.amount ?? 0).toFixed(2)),
        expenseCount: expenseSummary._count,
        totalIncome: parseFloat((incomeSummary._sum.total ?? 0).toFixed(2)),
        orderCount: incomeSummary._count,
        netProfit: parseFloat(
          ((incomeSummary._sum.total ?? 0) - (expenseSummary._sum.amount ?? 0)).toFixed(2),
        ),
        employeeCount,
        budgetCount,
        recentExpenses,
        expensesByCategory: expensesByCat,
        monthlyTrend,
      };
    }),

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
    .query(async ({ input }) => {
      const fromDate = startOfDay(input.from);
      const toDate = endOfDay(input.to);

      if (input.type === "income_statement") {
        const [income, expGroups] = await Promise.all([
          prisma.order.aggregate({
            where: {
              status: "FULFILLED",
              createdAt: { gte: fromDate, lte: toDate },
            },
            _sum: { total: true, taxAmt: true, discountAmt: true },
            _count: true,
          }),
          prisma.expense.groupBy({
            by: ["categoryId"],
            where: {
              date: { gte: fromDate, lte: toDate },
              status: { not: "CANCELLED" },
            },
            _sum: { amount: true },
          }),
        ]);

        const catIds = expGroups.map((e) => e.categoryId);
        const cats = await prisma.expenseCategory.findMany({
          where: { id: { in: catIds } },
        });
        const catMap = new Map(cats.map((c) => [c.id, c]));

        const expenseRows = expGroups
          .map((e) => ({
            category: catMap.get(e.categoryId)?.name ?? "Unknown",
            color: catMap.get(e.categoryId)?.color ?? "#6366f1",
            amount: parseFloat((e._sum.amount ?? 0).toFixed(2)),
          }))
          .sort((a, b) => b.amount - a.amount);

        const totalExpenses = expenseRows.reduce((s, e) => s + e.amount, 0);

        return {
          type: "income_statement" as const,
          income: {
            grossRevenue: parseFloat((income._sum.total ?? 0).toFixed(2)),
            taxCollected: parseFloat((income._sum.taxAmt ?? 0).toFixed(2)),
            discountsGiven: parseFloat((income._sum.discountAmt ?? 0).toFixed(2)),
            orderCount: income._count,
          },
          expenses: { rows: expenseRows, total: parseFloat(totalExpenses.toFixed(2)) },
          netProfit: parseFloat(((income._sum.total ?? 0) - totalExpenses).toFixed(2)),
        };
      }

      if (input.type === "expense") {
        const expenses = await prisma.expense.findMany({
          where: {
            date: { gte: fromDate, lte: toDate },
            status: { not: "CANCELLED" },
            ...(input.categoryId && { categoryId: input.categoryId }),
          },
          include: {
            category: true,
            employee: { select: { id: true, name: true } },
          },
          orderBy: { date: "desc" },
        });

        return {
          type: "expense" as const,
          items: expenses,
          total: parseFloat(
            expenses.reduce((s, e) => s + e.amount, 0).toFixed(2),
          ),
        };
      }

      // employee_salary
      const employees = await prisma.employee.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });

      const diffMs = toDate.getTime() - fromDate.getTime();
      const months = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24 * 30)));

      const rows = employees.map((e) => {
        const monthlySalary = toMonthlySalary(e.salary, e.salaryType);
        return {
          id: e.id,
          name: e.name,
          position: e.position,
          salary: e.salary,
          salaryType: e.salaryType,
          monthlySalary: parseFloat(monthlySalary.toFixed(2)),
          totalForPeriod: parseFloat((monthlySalary * months).toFixed(2)),
          joinDate: e.joinDate,
        };
      });

      return {
        type: "employee_salary" as const,
        items: rows,
        totalSalary: parseFloat(
          rows.reduce((s, r) => s + r.totalForPeriod, 0).toFixed(2),
        ),
        months,
      };
    }),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toMonthlySalary(
  salary: number,
  type: "MONTHLY" | "HOURLY" | "WEEKLY" | "ANNUALLY",
): number {
  switch (type) {
    case "HOURLY":
      return salary * 160;
    case "WEEKLY":
      return salary * 4.33;
    case "ANNUALLY":
      return salary / 12;
    default:
      return salary;
  }
}

function getBudgetDateRange(
  period: string,
  startDate: Date,
  endDate: Date | null,
): { from: Date; to: Date } {
  const now = new Date();
  switch (period) {
    case "WEEKLY":
      return { from: startOfWeek(now), to: endOfWeek(now) };
    case "QUARTERLY":
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
    case "YEARLY":
      return { from: startOfYear(now), to: endOfYear(now) };
    default: // MONTHLY
      return {
        from: startDate,
        to: endDate ?? endOfMonth(now),
      };
  }
}

async function getMonthlyTrend() {
  const months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date(),
  });

  return Promise.all(
    months.map(async (month) => {
      const from = startOfMonth(month);
      const to = endOfMonth(month);

      const [income, expenses] = await Promise.all([
        prisma.order.aggregate({
          where: { status: "FULFILLED", createdAt: { gte: from, lte: to } },
          _sum: { total: true },
        }),
        prisma.expense.aggregate({
          where: {
            date: { gte: from, lte: to },
            status: { not: "CANCELLED" },
          },
          _sum: { amount: true },
        }),
      ]);

      return {
        month: format(month, "MMM yy"),
        income: parseFloat((income._sum.total ?? 0).toFixed(2)),
        expenses: parseFloat((expenses._sum.amount ?? 0).toFixed(2)),
      };
    }),
  );
}
