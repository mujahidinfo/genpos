import { Injectable } from '@nestjs/common';
import type { TenantContext } from '../../common/types.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateCategoryDto, UpdateCategoryDto } from './categories.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenant: TenantContext) {
    return this.prisma.category.findMany({
      where: { businessId: tenant.businessId },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
  }

  create(tenant: TenantContext, input: CreateCategoryDto) {
    return this.prisma.category.create({
      data: { ...input, businessId: tenant.businessId },
    });
  }

  update(tenant: TenantContext, id: string, input: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id, businessId: tenant.businessId },
      data: input,
    });
  }

  delete(tenant: TenantContext, id: string) {
    return this.prisma.category.delete({
      where: { id, businessId: tenant.businessId },
    });
  }
}
