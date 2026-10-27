import { Injectable } from '@nestjs/common';
import type { Prisma } from '@genpos/db';
import { endOfDay, startOfDay } from 'date-fns';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  CreateExpenseDto,
  ListExpensesQueryDto,
  UpdateExpenseDto,
} from './finance.dto.js';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(input: ListExpensesQueryDto) {
    const { page, pageSize } = input;
    const where: Prisma.ExpenseWhereInput = {
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

  create(input: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: input,
      include: { category: true, employee: true },
    });
  }

  update(id: string, input: UpdateExpenseDto) {
    return this.prisma.expense.update({
      where: { id },
      data: input,
      include: { category: true, employee: true },
    });
  }

  delete(id: string) {
    return this.prisma.expense.delete({ where: { id } });
  }
}
