import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { endOfDay, format, getDaysInMonth, isAfter, parse, startOfDay } from 'date-fns';
import type { TenantContext } from '../../common/types.js';
import { round2 } from '../../common/utils.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { PaySalaryDto } from './finance.dto.js';
import { toMonthlySalary } from './finance.helpers.js';
import { ensureExpenseCategory, monthKey, SALARY_CATEGORY } from './finance.ledger.js';

export type PayrollState = 'PAID' | 'DUE' | 'UPCOMING';

/** Salaries for one month: who is owed what, and who has already been paid. */
@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  async month(tenant: TenantContext, month?: string) {
    const key = month ?? monthKey(new Date());
    const monthStart = parse(key, 'yyyy-MM', new Date());
    const today = startOfDay(new Date());

    const employees = await this.prisma.employee.findMany({
      where: { businessId: tenant.businessId, isActive: true },
      orderBy: { name: 'asc' },
    });
    const paid = await this.prisma.expense.findMany({
      where: {
        businessId: tenant.businessId,
        source: 'SALARY',
        periodKey: key,
        status: { not: 'CANCELLED' },
        employeeId: { in: employees.map((e) => e.id) },
      },
      select: { id: true, employeeId: true, amount: true, date: true },
    });

    const items = employees.map((e) => {
      const payment = paid.find((p) => p.employeeId === e.id);
      const dueDate = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth(),
        Math.min(e.payDay, getDaysInMonth(monthStart)),
      );
      const state: PayrollState = payment
        ? 'PAID'
        : isAfter(dueDate, endOfDay(today))
          ? 'UPCOMING'
          : 'DUE';
      return {
        employeeId: e.id,
        membershipId: e.membershipId,
        name: e.name,
        position: e.position,
        phone: e.phone,
        salary: e.salary,
        salaryType: e.salaryType,
        payDay: e.payDay,
        amount: round2(toMonthlySalary(e.salary, e.salaryType)),
        dueDate,
        state,
        paidAmount: payment?.amount ?? null,
        paidOn: payment?.date ?? null,
        expenseId: payment?.id ?? null,
      };
    });

    const sum = (list: typeof items) => round2(list.reduce((n, i) => n + i.amount, 0));
    return {
      month: key,
      label: format(monthStart, 'MMMM yyyy'),
      items,
      totals: {
        total: sum(items),
        paid: round2(paid.reduce((n, p) => n + p.amount, 0)),
        outstanding: sum(items.filter((i) => i.state !== 'PAID')),
        dueCount: items.filter((i) => i.state === 'DUE').length,
      },
    };
  }

  /** Record a salary payment: it lands in the expense ledger like any other spending. */
  async pay(tenant: TenantContext, employeeId: string, input: PaySalaryDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, businessId: tenant.businessId },
    });
    if (!employee) throw new NotFoundException('Staff member not found');

    const key = input.month ?? monthKey(new Date());
    const monthStart = parse(key, 'yyyy-MM', new Date());
    const already = await this.prisma.expense.findFirst({
      where: {
        employeeId,
        source: 'SALARY',
        periodKey: key,
        status: { not: 'CANCELLED' },
      },
    });
    if (already) {
      throw new ConflictException(`${employee.name} is already paid for ${format(monthStart, 'MMMM')}`);
    }

    const amount = round2(input.amount ?? toMonthlySalary(employee.salary, employee.salaryType));
    return this.prisma.$transaction(async (tx) => {
      const category = await ensureExpenseCategory(tx, tenant.businessId, SALARY_CATEGORY);
      return tx.expense.create({
        data: {
          businessId: tenant.businessId,
          shopId: tenant.shopId,
          title: `${employee.name} · ${format(monthStart, 'MMMM')} salary`,
          amount,
          date: new Date(),
          categoryId: category.id,
          employeeId,
          paymentMethod: input.paymentMethod,
          status: 'PAID',
          source: 'SALARY',
          periodKey: key,
          notes: input.note,
        },
        include: { category: true, employee: true },
      });
    });
  }
}
