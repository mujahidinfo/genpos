import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
} from './categories.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
  }

  create(input: CreateCategoryDto) {
    return this.prisma.category.create({ data: input });
  }

  update(id: string, input: UpdateCategoryDto) {
    return this.prisma.category.update({ where: { id }, data: input });
  }

  delete(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
