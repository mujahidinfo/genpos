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
import {
  CreateBudgetDto,
  CreateEmployeeDto,
  CreateExpenseCategoryDto,
  CreateExpenseDto,
  FinanceOverviewQueryDto,
  FinanceReportQueryDto,
  ListExpensesQueryDto,
  UpdateBudgetDto,
  UpdateEmployeeDto,
  UpdateExpenseCategoryDto,
  UpdateExpenseDto,
} from './finance.dto.js';
import { FinanceService } from './finance.service.js';

// All finance routes are owner/manager-only.

@ApiTags('finance')
@ApiBearerAuth()
@Roles(...MANAGERS)
@Controller('finance')
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

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
  constructor(private readonly employees: EmployeesService) {}

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
