import { Injectable } from '@nestjs/common';
import type { TenantContext } from '../../common/types.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  CreateCustomerDto,
  FindOrCreateCustomerDto,
  UpdateCustomerDto,
} from './customers.dto.js';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenant: TenantContext, search?: string) {
    return this.prisma.customer.findMany({
      where: {
        businessId: tenant.businessId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      },
      include: { _count: { select: { orders: true } } },
      orderBy: { name: 'asc' },
    });
  }

  getById(tenant: TenantContext, id: string) {
    return this.prisma.customer.findUniqueOrThrow({
      where: { id, businessId: tenant.businessId },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { items: true },
        },
      },
    });
  }

  /** Partial phone match used by the POS customer lookup; null for short input. */
  getByPhone(tenant: TenantContext, phone: string) {
    const trimmed = phone.trim();
    if (trimmed.length < 4) return null;
    return this.prisma.customer.findFirst({
      where: { businessId: tenant.businessId, phone: { contains: trimmed } },
    });
  }

  create(tenant: TenantContext, input: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: { ...input, businessId: tenant.businessId },
    });
  }

  async findOrCreate(tenant: TenantContext, input: FindOrCreateCustomerDto) {
    const existing = await this.prisma.customer.findFirst({
      where: { businessId: tenant.businessId, phone: input.phone },
    });
    if (existing) return existing;
    return this.prisma.customer.create({
      data: { ...input, businessId: tenant.businessId },
    });
  }

  update(tenant: TenantContext, id: string, input: UpdateCustomerDto) {
    return this.prisma.customer.update({
      where: { id, businessId: tenant.businessId },
      data: input,
    });
  }

  delete(tenant: TenantContext, id: string) {
    return this.prisma.customer.delete({
      where: { id, businessId: tenant.businessId },
    });
  }
}
