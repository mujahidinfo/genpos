import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { RecurringExpense, RecurringFrequency } from '@genpos/db';
import { addMonths, addWeeks, differenceInCalendarDays, startOfDay } from 'date-fns';
import type { TenantContext } from '../../common/types.js';
import { round2 } from '../../common/utils.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  CreateRecurringDto,
  PayRecurringDto,
  UpdateRecurringDto,
} from './finance.dto.js';
import { PayrollService } from './payroll.service.js';

const nextDate = (from: Date, frequency: RecurringFrequency) =>
  frequency === 'WEEKLY' ? addWeeks(from, 1) : addMonths(from, 1);

/** Bills that repeat (rent, internet…) and the "what's due" view across bills and salaries. */
@Injectable()
export class RecurringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payroll: PayrollService,
  ) {}

  async list(tenant: TenantContext) {
    const items = await this.prisma.recurringExpense.findMany({
      where: { shopId: tenant.shopId },
      include: { category: true },
      orderBy: [{ isActive: 'desc' }, { nextDueDate: 'asc' }],
    });
    return items.map((r) => this.withDue(r));
  }

  async create(tenant: TenantContext, input: CreateRecurringDto) {
    await this.assertCategory(tenant, input.categoryId);
    const created = await this.prisma.recurringExpense.create({
      data: { ...input, businessId: tenant.businessId, shopId: tenant.shopId },
      include: { category: true },
    });
    return this.withDue(created);
  }

  async update(tenant: TenantContext, id: string, input: UpdateRecurringDto) {
    if (input.categoryId) await this.assertCategory(tenant, input.categoryId);
    const updated = await this.prisma.recurringExpense.update({
      where: { id, shopId: tenant.shopId },
      data: input,
      include: { category: true },
    });
    return this.withDue(updated);
  }

  async delete(tenant: TenantContext, id: string) {
    // Paid history stays in the ledger; only the reminder goes.
    await this.prisma.recurringExpense.delete({ where: { id, shopId: tenant.shopId } });
    return { success: true };
  }

  /** Confirm a bill: records the expense and moves the next due date on. */
  async pay(tenant: TenantContext, id: string, input: PayRecurringDto) {
    const bill = await this.prisma.recurringExpense.findFirst({
      where: { id, shopId: tenant.shopId },
    });
    if (!bill) throw new NotFoundException('Bill not found');

    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          businessId: tenant.businessId,
          shopId: tenant.shopId,
          title: bill.title,
          amount: round2(input.amount ?? bill.amount),
          date: input.date ?? new Date(),
          categoryId: bill.categoryId,
          paymentMethod: input.paymentMethod ?? bill.paymentMethod,
          status: 'PAID',
          source: 'RECURRING',
          isRecurring: true,
          recurringId: bill.id,
          notes: bill.notes,
        },
        include: { category: true, employee: true },
      });
      // Move on from the due date (not today) so a late payment doesn't drift the schedule.
      await tx.recurringExpense.update({
        where: { id: bill.id },
        data: { nextDueDate: nextDate(bill.nextDueDate, bill.frequency) },
      });
      return expense;
    });
  }

  /**
   * Everything that needs paying soon — overdue or due within `withinDays` —
   * across recurring bills and this month's salaries, soonest first.
   */
  async upcoming(tenant: TenantContext, withinDays = 7) {
    const [bills, payroll] = await Promise.all([
      this.prisma.recurringExpense.findMany({
        where: { shopId: tenant.shopId, isActive: true },
        include: { category: true },
      }),
      this.payroll.month(tenant),
    ]);

    const horizon = startOfDay(new Date());
    const within = (due: Date) => differenceInCalendarDays(due, horizon) <= withinDays;

    const entries = [
      ...bills
        .filter((b) => within(b.nextDueDate))
        .map((b) => ({
          kind: 'BILL' as const,
          id: b.id,
          title: b.title,
          subtitle: b.category.name,
          amount: b.amount,
          dueDate: b.nextDueDate,
        })),
      ...payroll.items
        .filter((p) => p.state !== 'PAID' && within(p.dueDate))
        .map((p) => ({
          kind: 'SALARY' as const,
          id: p.employeeId,
          title: p.name,
          subtitle: `${payroll.label} salary`,
          amount: p.amount,
          dueDate: p.dueDate,
        })),
    ]
      .map((e) => ({ ...e, daysUntil: differenceInCalendarDays(e.dueDate, horizon) }))
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    return {
      items: entries,
      total: round2(entries.reduce((n, e) => n + e.amount, 0)),
      overdueCount: entries.filter((e) => e.daysUntil < 0).length,
    };
  }

  private withDue<T extends RecurringExpense>(r: T) {
    return { ...r, daysUntil: differenceInCalendarDays(r.nextDueDate, startOfDay(new Date())) };
  }

  private async assertCategory(tenant: TenantContext, categoryId: string) {
    const found = await this.prisma.expenseCategory.findFirst({
      where: { id: categoryId, businessId: tenant.businessId },
    });
    if (!found) throw new BadRequestException('Unknown expense category');
  }
}
