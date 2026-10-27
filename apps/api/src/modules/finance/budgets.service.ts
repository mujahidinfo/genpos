import { BadRequestException, Injectable } from '@nestjs/common';
import type { TenantContext } from '../../common/types.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateBudgetDto, UpdateBudgetDto } from './finance.dto.js';
import { getBudgetDateRange } from './finance.helpers.js';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Budgets with how much has been spent against each in its current period. */
  async list(tenant: TenantContext) {
    const budgets = await this.prisma.budget.findMany({
      where: { shopId: tenant.shopId },
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
            shopId: tenant.shopId,
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

  async create(tenant: TenantContext, input: CreateBudgetDto) {
    await this.assertCategory(tenant, input.categoryId);
    return this.prisma.budget.create({
      data: {
        ...input,
        businessId: tenant.businessId,
        shopId: tenant.shopId,
      },
      include: { category: true },
    });
  }

  async update(tenant: TenantContext, id: string, input: UpdateBudgetDto) {
    await this.assertCategory(tenant, input.categoryId);
    return this.prisma.budget.update({
      where: { id, shopId: tenant.shopId },
      data: input,
      include: { category: true },
    });
  }

  delete(tenant: TenantContext, id: string) {
    return this.prisma.budget.delete({ where: { id, shopId: tenant.shopId } });
  }

  private async assertCategory(
    tenant: TenantContext,
    categoryId?: string | null,
  ) {
    if (!categoryId) return;
    const found = await this.prisma.expenseCategory.findFirst({
      where: { id: categoryId, businessId: tenant.businessId },
    });
    if (!found) throw new BadRequestException('Unknown expense category');
  }
}
