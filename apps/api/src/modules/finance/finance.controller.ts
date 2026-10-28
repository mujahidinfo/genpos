import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MANAGERS, Roles, Tenant } from '../../common/decorators.js';
import type { TenantContext } from '../../common/types.js';
import { BudgetsService } from './budgets.service.js';
import { EmployeesService } from './employees.service.js';
import { ExpenseCategoriesService } from './expense-categories.service.js';
import { ExpensesService } from './expenses.service.js';
import { PayrollService } from './payroll.service.js';
import { RecurringService } from './recurring.service.js';
import {
  CreateBudgetDto,
  CreateEmployeeDto,
  CreateExpenseCategoryDto,
  CreateExpenseDto,
  CreateRecurringDto,
  FinanceOverviewQueryDto,
  FinanceReportQueryDto,
  ListExpensesQueryDto,
  PayRecurringDto,
  PayrollQueryDto,
  PaySalaryDto,
  UpcomingQueryDto,
  UpdateBudgetDto,
  UpdateEmployeeDto,
  UpdateExpenseCategoryDto,
  UpdateExpenseDto,
  UpdateRecurringDto,
} from './finance.dto.js';
import { FinanceService } from './finance.service.js';

// All finance routes are owner/manager-only.

@ApiTags('finance')
@ApiBearerAuth()
@Roles(...MANAGERS)
@Controller('finance')
export class FinanceController {
  constructor(
    private readonly finance: FinanceService,
    private readonly recurring: RecurringService,
    private readonly payroll: PayrollService,
  ) {}

  /** Bills and salaries that are overdue or due soon — what to pay next. */
  @Get('upcoming')
  upcoming(@Tenant() tenant: TenantContext, @Query() query: UpcomingQueryDto) {
    return this.recurring.upcoming(tenant, query.days);
  }

  /** Salaries for a month (`?month=2026-10`): who is owed and who is paid. */
  @Get('payroll')
  payrollMonth(@Tenant() tenant: TenantContext, @Query() query: PayrollQueryDto) {
    return this.payroll.month(tenant, query.month);
  }

  @Get('overview')
  overview(
    @Tenant() tenant: TenantContext,
    @Query() query: FinanceOverviewQueryDto,
  ) {
    return this.finance.overview(tenant, query.days);
  }

  @Get('report')
  report(
    @Tenant() tenant: TenantContext,
    @Query() query: FinanceReportQueryDto,
  ) {
    return this.finance.report(tenant, query);
  }
}

@ApiTags('finance / expense categories')
@ApiBearerAuth()
@Roles(...MANAGERS)
@Controller('finance/expense-categories')
export class ExpenseCategoriesController {
  constructor(private readonly categories: ExpenseCategoriesService) {}

  @Get()
  list(@Tenant() tenant: TenantContext) {
    return this.categories.list(tenant);
  }

  @Post()
  create(
    @Tenant() tenant: TenantContext,
    @Body() body: CreateExpenseCategoryDto,
  ) {
    return this.categories.create(tenant, body);
  }

  @Patch(':id')
  update(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: UpdateExpenseCategoryDto,
  ) {
    return this.categories.update(tenant, id, body);
  }

  @Delete(':id')
  delete(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.categories.delete(tenant, id);
  }
}

@ApiTags('finance / expenses')
@ApiBearerAuth()
@Roles(...MANAGERS)
@Controller('finance/expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  list(@Tenant() tenant: TenantContext, @Query() query: ListExpensesQueryDto) {
    return this.expenses.list(tenant, query);
  }

  @Post()
  create(@Tenant() tenant: TenantContext, @Body() body: CreateExpenseDto) {
    return this.expenses.create(tenant, body);
  }

  @Patch(':id')
  update(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: UpdateExpenseDto,
  ) {
    return this.expenses.update(tenant, id, body);
  }

  @Delete(':id')
  delete(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.expenses.delete(tenant, id);
  }
}

@ApiTags('finance / employees')
@ApiBearerAuth()
@Roles(...MANAGERS)
@Controller('finance/employees')
export class EmployeesController {
  constructor(
    private readonly employees: EmployeesService,
    private readonly payroll: PayrollService,
  ) {}

  /** Pay a month's salary; it is recorded as an expense. */
  @Post(':id/pay')
  pay(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: PaySalaryDto,
  ) {
    return this.payroll.pay(tenant, id, body);
  }

  @Get()
  list(@Tenant() tenant: TenantContext) {
    return this.employees.list(tenant);
  }

  @Post()
  create(@Tenant() tenant: TenantContext, @Body() body: CreateEmployeeDto) {
    return this.employees.create(tenant, body);
  }

  @Patch(':id')
  update(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: UpdateEmployeeDto,
  ) {
    return this.employees.update(tenant, id, body);
  }
}

@ApiTags('finance / recurring')
@ApiBearerAuth()
@Roles(...MANAGERS)
@Controller('finance/recurring')
export class RecurringController {
  constructor(private readonly recurring: RecurringService) {}

  @Get()
  list(@Tenant() tenant: TenantContext) {
    return this.recurring.list(tenant);
  }

  @Post()
  create(@Tenant() tenant: TenantContext, @Body() body: CreateRecurringDto) {
    return this.recurring.create(tenant, body);
  }

  @Patch(':id')
  update(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: UpdateRecurringDto,
  ) {
    return this.recurring.update(tenant, id, body);
  }

  @Delete(':id')
  delete(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.recurring.delete(tenant, id);
  }

  /** Confirm a bill as paid (optionally with a different amount). */
  @Post(':id/pay')
  pay(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: PayRecurringDto,
  ) {
    return this.recurring.pay(tenant, id, body);
  }
}

@ApiTags('finance / budgets')
@ApiBearerAuth()
@Roles(...MANAGERS)
@Controller('finance/budgets')
export class BudgetsController {
  constructor(private readonly budgets: BudgetsService) {}

  @Get()
  list(@Tenant() tenant: TenantContext) {
    return this.budgets.list(tenant);
  }

  @Post()
  create(@Tenant() tenant: TenantContext, @Body() body: CreateBudgetDto) {
    return this.budgets.create(tenant, body);
  }

  @Patch(':id')
  update(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: UpdateBudgetDto,
  ) {
    return this.budgets.update(tenant, id, body);
  }

  @Delete(':id')
  delete(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.budgets.delete(tenant, id);
  }
}
