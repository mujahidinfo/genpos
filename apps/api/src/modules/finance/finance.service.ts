import { Injectable } from '@nestjs/common';
import {
  eachMonthOfInterval,
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import type { TenantContext } from '../../common/types.js';
import { round2 } from '../../common/utils.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { FinanceReportQueryDto } from './finance.dto.js';
import { toMonthlySalary } from './finance.helpers.js';

const DEFAULT_COLOR = '#6366f1';

/**
 * Income (orders) and expenses are per branch; employees are business-wide,
 * so the salary report covers everyone in the business.
 */
@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(tenant: TenantContext, days: number) {
    const from = startOfDay(subDays(new Date(), days - 1));
    const to = endOfDay(new Date());
    const shopExpenses = {
      shopId: tenant.shopId,
      status: { not: 'CANCELLED' as const },
    };

    const [
      expenseSummary,
      incomeSummary,
      employeeCount,
      budgetCount,
      recentExpenses,
      expenseGroups,
      sourceGroups,
      monthlyTrend,
    ] = await Promise.all([
      this.prisma.expense.aggregate({
        where: { ...shopExpenses, date: { gte: from, lte: to } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.order.aggregate({
        where: {
          shopId: tenant.shopId,
          status: 'FULFILLED',
          createdAt: { gte: from, lte: to },
        },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.employee.count({
        where: { businessId: tenant.businessId, isActive: true },
      }),
      this.prisma.budget.count({ where: { shopId: tenant.shopId } }),
      this.prisma.expense.findMany({
        where: shopExpenses,
        include: { category: true },
        orderBy: { date: 'desc' },
        take: 6,
      }),
      this.prisma.expense.groupBy({
        by: ['categoryId'],
        where: { ...shopExpenses, date: { gte: from, lte: to } },
        _sum: { amount: true },
      }),
      this.prisma.expense.groupBy({
        by: ['source'],
        where: { ...shopExpenses, date: { gte: from, lte: to } },
        _sum: { amount: true },
      }),
      this.monthlyTrend(tenant),
    ]);

    const catMap = await this.expenseCategoryMap(
      tenant,
      expenseGroups.map((e) => e.categoryId),
    );
    const expensesByCategory = expenseGroups
      .map((e) => ({
        categoryId: e.categoryId,
        name: catMap.get(e.categoryId)?.name ?? 'Unknown',
        color: catMap.get(e.categoryId)?.color ?? DEFAULT_COLOR,
        amount: round2(e._sum.amount ?? 0),
      }))
      .sort((a, b) => b.amount - a.amount);

    const totalIncome = incomeSummary._sum.total ?? 0;
    const totalExpenses = expenseSummary._sum.amount ?? 0;
    return {
      totalExpenses: round2(totalExpenses),
      expenseCount: expenseSummary._count,
      totalIncome: round2(totalIncome),
      orderCount: incomeSummary._count,
      netProfit: round2(totalIncome - totalExpenses),
      employeeCount,
      budgetCount,
      recentExpenses,
      expensesByCategory,
      expensesBySource: sourceGroups.map((g) => ({
        source: g.source,
        amount: round2(g._sum.amount ?? 0),
      })),
      monthlyTrend,
    };
  }

  report(tenant: TenantContext, input: FinanceReportQueryDto) {
    const from = startOfDay(input.from);
    const to = endOfDay(input.to);
    switch (input.type) {
      case 'income_statement':
        return this.incomeStatement(tenant, from, to);
      case 'expense':
        return this.expenseReport(tenant, from, to, input.categoryId);
      case 'employee_salary':
        return this.salaryReport(tenant, from, to);
    }
  }

  private async incomeStatement(tenant: TenantContext, from: Date, to: Date) {
    const [income, expenseGroups] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          shopId: tenant.shopId,
          status: 'FULFILLED',
          createdAt: { gte: from, lte: to },
        },
        _sum: { total: true, taxAmt: true, discountAmt: true },
        _count: true,
      }),
      this.prisma.expense.groupBy({
        by: ['categoryId'],
        where: {
          shopId: tenant.shopId,
          date: { gte: from, lte: to },
          status: { not: 'CANCELLED' },
        },
        _sum: { amount: true },
      }),
    ]);

    const catMap = await this.expenseCategoryMap(
      tenant,
      expenseGroups.map((e) => e.categoryId),
    );
    const rows = expenseGroups
      .map((e) => ({
        category: catMap.get(e.categoryId)?.name ?? 'Unknown',
        color: catMap.get(e.categoryId)?.color ?? DEFAULT_COLOR,
        amount: round2(e._sum.amount ?? 0),
      }))
      .sort((a, b) => b.amount - a.amount);
    const totalExpenses = rows.reduce((s, e) => s + e.amount, 0);

    return {
      type: 'income_statement' as const,
      income: {
        grossRevenue: round2(income._sum.total ?? 0),
        taxCollected: round2(income._sum.taxAmt ?? 0),
        discountsGiven: round2(income._sum.discountAmt ?? 0),
        orderCount: income._count,
      },
      expenses: { rows, total: round2(totalExpenses) },
      netProfit: round2((income._sum.total ?? 0) - totalExpenses),
    };
  }

  private async expenseReport(
    tenant: TenantContext,
    from: Date,
    to: Date,
    categoryId?: string,
  ) {
    const items = await this.prisma.expense.findMany({
      where: {
        shopId: tenant.shopId,
        date: { gte: from, lte: to },
        status: { not: 'CANCELLED' },
        ...(categoryId && { categoryId }),
      },
      include: {
        category: true,
        employee: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });

    return {
      type: 'expense' as const,
      items,
      total: round2(items.reduce((s, e) => s + e.amount, 0)),
    };
  }

  private async salaryReport(tenant: TenantContext, from: Date, to: Date) {
    const employees = await this.prisma.employee.findMany({
      where: { businessId: tenant.businessId, isActive: true },
      orderBy: { name: 'asc' },
    });

    const diffMs = to.getTime() - from.getTime();
    const months = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24 * 30)));

    const items = employees.map((e) => {
      const monthlySalary = toMonthlySalary(e.salary, e.salaryType);
      return {
        id: e.id,
        name: e.name,
        position: e.position,
        salary: e.salary,
        salaryType: e.salaryType,
        monthlySalary: round2(monthlySalary),
        totalForPeriod: round2(monthlySalary * months),
        joinDate: e.joinDate,
      };
    });

    return {
      type: 'employee_salary' as const,
      items,
      totalSalary: round2(items.reduce((s, r) => s + r.totalForPeriod, 0)),
      months,
    };
  }

  /** Income vs expenses for the last 6 months. */
  private monthlyTrend(tenant: TenantContext) {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return Promise.all(
      months.map(async (month) => {
        const from = startOfMonth(month);
        const to = endOfMonth(month);
        const [income, expenses] = await Promise.all([
          this.prisma.order.aggregate({
            where: {
              shopId: tenant.shopId,
              status: 'FULFILLED',
              createdAt: { gte: from, lte: to },
            },
            _sum: { total: true },
          }),
          this.prisma.expense.aggregate({
            where: {
              shopId: tenant.shopId,
              date: { gte: from, lte: to },
              status: { not: 'CANCELLED' },
            },
            _sum: { amount: true },
          }),
        ]);
        return {
          month: format(month, 'MMM yy'),
          income: round2(income._sum.total ?? 0),
          expenses: round2(expenses._sum.amount ?? 0),
        };
      }),
    );
  }

  private async expenseCategoryMap(tenant: TenantContext, ids: string[]) {
    const categories = await this.prisma.expenseCategory.findMany({
      where: { businessId: tenant.businessId, id: { in: ids } },
    });
    return new Map(categories.map((c) => [c.id, c]));
  }
}
