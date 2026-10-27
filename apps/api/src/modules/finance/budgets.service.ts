import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateBudgetDto, UpdateBudgetDto } from './finance.dto.js';
import { getBudgetDateRange } from './finance.helpers.js';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Budgets with how much has been spent against each in its current period. */
  async list() {
    const budgets = await this.prisma.budget.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      budgets.map(async (budget) => {
        const { from, to } = getBudgetDateRange(
          budget.period,
          budget.startDate,
          budget.endDate,
        );
        const result = await this.prisma.expense.aggregate({
          where: {
            date: { gte: from, lte: to },
            status: { not: 'CANCELLED' },
            ...(budget.categoryId && { categoryId: budget.categoryId }),
          },
          _sum: { amount: true },
        });

        const spent = result._sum.amount ?? 0;
        const percentage =
          budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
        return { ...budget, spent, percentage };
      }),
    );
  }

  create(input: CreateBudgetDto) {
    return this.prisma.budget.create({
      data: input,
      include: { category: true },
    });
  }

  update(id: string, input: UpdateBudgetDto) {
    return this.prisma.budget.update({
      where: { id },
      data: input,
      include: { category: true },
    });
  }

  delete(id: string) {
    return this.prisma.budget.delete({ where: { id } });
  }
}
