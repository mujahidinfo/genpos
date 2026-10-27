import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma } from '@genpos/db';
import { endOfDay, startOfDay } from 'date-fns';
import type { TenantContext } from '../../common/types.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  CreateExpenseDto,
  ListExpensesQueryDto,
  UpdateExpenseDto,
} from './finance.dto.js';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenant: TenantContext, input: ListExpensesQueryDto) {
    const { page, pageSize } = input;
    const where: Prisma.ExpenseWhereInput = {
      shopId: tenant.shopId,
      ...(input.categoryId && { categoryId: input.categoryId }),
      ...(input.employeeId && { employeeId: input.employeeId }),
      ...(input.status && { status: input.status }),
      ...(input.paymentMethod && { paymentMethod: input.paymentMethod }),
      ...((input.from || input.to) && {
        date: {
          ...(input.from && { gte: startOfDay(input.from) }),
          ...(input.to && { lte: endOfDay(input.to) }),
        },
      }),
      ...(input.search && {
        OR: [
          { title: { contains: input.search, mode: 'insensitive' as const } },
          { notes: { contains: input.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: {
          category: true,
          employee: { select: { id: true, name: true, position: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  async create(tenant: TenantContext, input: CreateExpenseDto) {
    await this.assertRefs(tenant, input);
    return this.prisma.expense.create({
      data: {
        ...input,
        businessId: tenant.businessId,
        shopId: tenant.shopId,
      },
      include: { category: true, employee: true },
    });
  }

  async update(tenant: TenantContext, id: string, input: UpdateExpenseDto) {
    await this.assertRefs(tenant, input);
    return this.prisma.expense.update({
      where: { id, shopId: tenant.shopId },
      data: input,
      include: { category: true, employee: true },
    });
  }

  delete(tenant: TenantContext, id: string) {
    return this.prisma.expense.delete({ where: { id, shopId: tenant.shopId } });
  }

  /** Category and employee must belong to this business. */
  private async assertRefs(
    tenant: TenantContext,
    input: { categoryId?: string; employeeId?: string | null },
  ) {
    const [category, employee] = await Promise.all([
      input.categoryId
        ? this.prisma.expenseCategory.findFirst({
            where: { id: input.categoryId, businessId: tenant.businessId },
          })
        : true,
      input.employeeId
        ? this.prisma.employee.findFirst({
            where: { id: input.employeeId, businessId: tenant.businessId },
          })
        : true,
    ]);
    if (!category) throw new BadRequestException('Unknown expense category');
    if (!employee) throw new BadRequestException('Unknown employee');
  }
}
