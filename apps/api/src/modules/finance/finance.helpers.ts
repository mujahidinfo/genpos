import type { BudgetPeriod, SalaryType } from '@genpos/db';
import {
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from 'date-fns';

export function toMonthlySalary(salary: number, type: SalaryType): number {
  switch (type) {
    case 'HOURLY':
      return salary * 160;
    case 'WEEKLY':
      return salary * 4.33;
    case 'ANNUALLY':
      return salary / 12;
    default:
      return salary;
  }
}

export function getBudgetDateRange(
  period: BudgetPeriod,
  startDate: Date,
  endDate: Date | null,
): { from: Date; to: Date } {
  const now = new Date();
  switch (period) {
    case 'WEEKLY':
      return { from: startOfWeek(now), to: endOfWeek(now) };
    case 'QUARTERLY':
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
    case 'YEARLY':
      return { from: startOfYear(now), to: endOfYear(now) };
    default: // MONTHLY
      return { from: startDate, to: endDate ?? endOfMonth(now) };
  }
}
