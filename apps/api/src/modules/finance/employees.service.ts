import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateEmployeeDto, UpdateEmployeeDto } from './finance.dto.js';
import { toMonthlySalary } from './finance.helpers.js';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const items = await this.prisma.employee.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { expenses: true } } },
    });

    const totalMonthlySalary = items
      .filter((e) => e.isActive)
      .reduce((sum, e) => sum + toMonthlySalary(e.salary, e.salaryType), 0);

    return { items, totalMonthlySalary };
  }

  async create(input: CreateEmployeeDto) {
    // The web form sends "" for an empty email field.
    const email = input.email || undefined;
    if (email) {
      const existing = await this.prisma.employee.findUnique({
        where: { email },
      });
      if (existing) throw new ConflictException('Email already in use');
    }
    return this.prisma.employee.create({ data: { ...input, email } });
  }

  update(id: string, input: UpdateEmployeeDto) {
    return this.prisma.employee.update({ where: { id }, data: input });
  }
}
