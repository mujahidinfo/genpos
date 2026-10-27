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
  list(@Query() query: ListCustomersQueryDto) {
    return this.customers.list(query.search);
  }

  // Declared before ':id' so "lookup" isn't captured as an id.
  @Get('lookup')
  lookup(@Query() query: CustomerLookupQueryDto) {
    return this.customers.getByPhone(query.phone);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.customers.getById(id);
  }

  @Post()
  create(@Body() body: CreateCustomerDto) {
    return this.customers.create(body);
  }

  @Post('find-or-create')
  findOrCreate(@Body() body: FindOrCreateCustomerDto) {
    return this.customers.findOrCreate(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateCustomerDto) {
    return this.customers.update(id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.customers.delete(id);
  }
}
