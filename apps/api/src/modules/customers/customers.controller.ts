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
import {
  CreateCustomerDto,
  CustomerLookupQueryDto,
  FindOrCreateCustomerDto,
  ListCustomersQueryDto,
  UpdateCustomerDto,
} from './customers.dto.js';
import { CustomersService } from './customers.service.js';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  list(@Tenant() tenant: TenantContext, @Query() query: ListCustomersQueryDto) {
    return this.customers.list(tenant, query.search);
  }

  // Declared before ':id' so "lookup" isn't captured as an id.
  @Get('lookup')
  lookup(
    @Tenant() tenant: TenantContext,
    @Query() query: CustomerLookupQueryDto,
  ) {
    return this.customers.getByPhone(tenant, query.phone);
  }

  @Get(':id')
  getById(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.customers.getById(tenant, id);
  }

  @Post()
  create(@Tenant() tenant: TenantContext, @Body() body: CreateCustomerDto) {
    return this.customers.create(tenant, body);
  }

  @Post('find-or-create')
  findOrCreate(
    @Tenant() tenant: TenantContext,
    @Body() body: FindOrCreateCustomerDto,
  ) {
    return this.customers.findOrCreate(tenant, body);
  }

  @Patch(':id')
  update(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: UpdateCustomerDto,
  ) {
    return this.customers.update(tenant, id, body);
  }

  @Roles(...MANAGERS)
  @Delete(':id')
  delete(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.customers.delete(tenant, id);
  }
}
