import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  MANAGERS,
  Roles,
  Tenant,
} from '../../common/decorators.js';
import type { AuthUser, TenantContext } from '../../common/types.js';
import {
  CreateOrderDto,
  CreateRefundDto,
  ListOrdersQueryDto,
  UpdateOrderStatusDto,
} from './orders.dto.js';
import { OrdersService } from './orders.service.js';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@Tenant() tenant: TenantContext, @Query() query: ListOrdersQueryDto) {
    return this.orders.list(tenant, query);
  }

  @Get(':id')
  getById(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.orders.getById(tenant, id);
  }

  @Post()
  create(
    @Tenant() tenant: TenantContext,
    @Body() body: CreateOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.orders.create(tenant, body, user.id);
  }

  @Patch(':id/status')
  updateStatus(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.orders.updateStatus(tenant, id, body);
  }

  @Roles(...MANAGERS)
  @Post(':id/refunds')
  refund(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: CreateRefundDto,
  ) {
    return this.orders.refund(tenant, id, body);
  }
}
