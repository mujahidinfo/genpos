import { Module } from '@nestjs/common';
import { BudgetsService } from './budgets.service.js';
import { EmployeesService } from './employees.service.js';
import { ExpenseCategoriesService } from './expense-categories.service.js';
import { ExpensesService } from './expenses.service.js';
import {
  BudgetsController,
  EmployeesController,
  ExpenseCategoriesController,
  ExpensesController,
  FinanceController,
  RecurringController,
} from './finance.controller.js';
import { FinanceService } from './finance.service.js';
import { PayrollService } from './payroll.service.js';
import { RecurringService } from './recurring.service.js';

@Module({
  controllers: [
    FinanceController,
    ExpenseCategoriesController,
    ExpensesController,
    EmployeesController,
    BudgetsController,
    RecurringController,
  ],
  providers: [
    FinanceService,
    ExpenseCategoriesService,
    ExpensesService,
    EmployeesService,
    BudgetsService,
    PayrollService,
    RecurringService,
  ],
})
export class FinanceModule {}
