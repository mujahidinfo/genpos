import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  CreateCustomerDto,
  FindOrCreateCustomerDto,
  UpdateCustomerDto,
} from './customers.dto.js';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  list(search?: string) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    return this.prisma.customer.findMany({
      where,
      include: { _count: { select: { orders: true } } },
      orderBy: { name: 'asc' },
    });
  }

  getById(id: string) {
    return this.prisma.customer.findUniqueOrThrow({
      where: { id },
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
  getByPhone(phone: string) {
    const trimmed = phone.trim();
    if (trimmed.length < 4) return null;
    return this.prisma.customer.findFirst({
      where: { phone: { contains: trimmed } },
    });
  }

  create(input: CreateCustomerDto) {
    return this.prisma.customer.create({ data: input });
  }

  async findOrCreate(input: FindOrCreateCustomerDto) {
    const existing = await this.prisma.customer.findFirst({
      where: { phone: input.phone },
    });
    if (existing) return existing;
    return this.prisma.customer.create({ data: input });
  }

  update(id: string, input: UpdateCustomerDto) {
    return this.prisma.customer.update({ where: { id }, data: input });
  }

  delete(id: string) {
    return this.prisma.customer.delete({ where: { id } });
  }
}
