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
import { Roles } from '../../common/decorators.js';
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

// All finance routes are ADMIN-only.

@ApiTags('finance')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('finance')
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get('overview')
  overview(@Query() query: FinanceOverviewQueryDto) {
    return this.finance.overview(query.days);
  }

  @Get('report')
  report(@Query() query: FinanceReportQueryDto) {
    return this.finance.report(query);
  }
}

@ApiTags('finance / expense categories')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('finance/expense-categories')
export class ExpenseCategoriesController {
  constructor(private readonly categories: ExpenseCategoriesService) {}

  @Get()
  list() {
    return this.categories.list();
  }

  @Post()
  create(@Body() body: CreateExpenseCategoryDto) {
    return this.categories.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateExpenseCategoryDto) {
    return this.categories.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.categories.delete(id);
  }
}

@ApiTags('finance / expenses')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('finance/expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  list(@Query() query: ListExpensesQueryDto) {
    return this.expenses.list(query);
  }

  @Post()
  create(@Body() body: CreateExpenseDto) {
    return this.expenses.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateExpenseDto) {
    return this.expenses.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.expenses.delete(id);
  }
}

@ApiTags('finance / employees')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('finance/employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  list() {
    return this.employees.list();
  }

  @Post()
  create(@Body() body: CreateEmployeeDto) {
    return this.employees.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateEmployeeDto) {
    return this.employees.update(id, body);
  }
}

@ApiTags('finance / budgets')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('finance/budgets')
export class BudgetsController {
  constructor(private readonly budgets: BudgetsService) {}

  @Get()
  list() {
    return this.budgets.list();
  }

  @Post()
  create(@Body() body: CreateBudgetDto) {
    return this.budgets.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateBudgetDto) {
    return this.budgets.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.budgets.delete(id);
  }
}
