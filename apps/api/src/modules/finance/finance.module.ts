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
} from './finance.controller.js';
import { FinanceService } from './finance.service.js';

@Module({
  controllers: [
    FinanceController,
    ExpenseCategoriesController,
    ExpensesController,
    EmployeesController,
    BudgetsController,
  ],
  providers: [
    FinanceService,
    ExpenseCategoriesService,
    ExpensesService,
    EmployeesService,
    BudgetsService,
  ],
})
export class FinanceModule {}
