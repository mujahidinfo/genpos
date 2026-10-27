import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  CreateExpenseCategoryDto,
  UpdateExpenseCategoryDto,
} from './finance.dto.js';

@Injectable()
export class ExpenseCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { expenses: true } } },
    });
  }

  async create(input: CreateExpenseCategoryDto) {
    const existing = await this.prisma.expenseCategory.findUnique({
      where: { name: input.name },
    });
    if (existing) throw new ConflictException('Category already exists');
    return this.prisma.expenseCategory.create({ data: input });
  }

  update(id: string, input: UpdateExpenseCategoryDto) {
    return this.prisma.expenseCategory.update({ where: { id }, data: input });
  }

  async delete(id: string) {
    const count = await this.prisma.expense.count({
      where: { categoryId: id },
    });
    if (count > 0) {
      throw new BadRequestException(
        `Cannot delete: ${count} expense(s) use this category`,
      );
    }
    return this.prisma.expenseCategory.delete({ where: { id } });
  }
}
