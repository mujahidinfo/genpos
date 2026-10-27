import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import type { TenantContext } from '../../common/types.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  CreateExpenseCategoryDto,
  UpdateExpenseCategoryDto,
} from './finance.dto.js';

@Injectable()
export class ExpenseCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenant: TenantContext) {
    return this.prisma.expenseCategory.findMany({
      where: { businessId: tenant.businessId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { expenses: true } } },
    });
  }

  async create(tenant: TenantContext, input: CreateExpenseCategoryDto) {
    const existing = await this.prisma.expenseCategory.findUnique({
      where: {
        businessId_name: { businessId: tenant.businessId, name: input.name },
      },
    });
    if (existing) throw new ConflictException('Category already exists');
    return this.prisma.expenseCategory.create({
      data: { ...input, businessId: tenant.businessId },
    });
  }

  update(tenant: TenantContext, id: string, input: UpdateExpenseCategoryDto) {
    return this.prisma.expenseCategory.update({
      where: { id, businessId: tenant.businessId },
      data: input,
    });
  }

  async delete(tenant: TenantContext, id: string) {
    const count = await this.prisma.expense.count({
      where: { categoryId: id, businessId: tenant.businessId },
    });
    if (count > 0) {
      throw new BadRequestException(
        `Cannot delete: ${count} expense(s) use this category`,
      );
    }
    return this.prisma.expenseCategory.delete({
      where: { id, businessId: tenant.businessId },
    });
  }
}
