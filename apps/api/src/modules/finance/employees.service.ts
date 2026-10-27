import { ConflictException, Injectable } from '@nestjs/common';
import type { TenantContext } from '../../common/types.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateEmployeeDto, UpdateEmployeeDto } from './finance.dto.js';
import { toMonthlySalary } from './finance.helpers.js';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenant: TenantContext) {
    const items = await this.prisma.employee.findMany({
      where: { businessId: tenant.businessId },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { expenses: true } } },
    });

    const totalMonthlySalary = items
      .filter((e) => e.isActive)
      .reduce((sum, e) => sum + toMonthlySalary(e.salary, e.salaryType), 0);

    return { items, totalMonthlySalary };
  }

  async create(tenant: TenantContext, input: CreateEmployeeDto) {
    // The web form sends "" for an empty email field.
    const email = input.email || undefined;
    if (email) {
      const existing = await this.prisma.employee.findUnique({
        where: { businessId_email: { businessId: tenant.businessId, email } },
      });
      if (existing) throw new ConflictException('Email already in use');
    }
    return this.prisma.employee.create({
      data: { ...input, email, businessId: tenant.businessId },
    });
  }

  update(tenant: TenantContext, id: string, input: UpdateEmployeeDto) {
    return this.prisma.employee.update({
      where: { id, businessId: tenant.businessId },
      data: input,
    });
  }
}
