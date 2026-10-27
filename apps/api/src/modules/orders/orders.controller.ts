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
import { CurrentUser } from '../../common/decorators.js';
import type { AuthUser } from '../../common/types.js';
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
  list(@Query() query: ListOrdersQueryDto) {
    return this.orders.list(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.orders.getById(id);
  }

  @Post()
  create(@Body() body: CreateOrderDto, @CurrentUser() user: AuthUser) {
    return this.orders.create(body, user.id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return this.orders.updateStatus(id, body);
  }

  @Post(':id/refunds')
  refund(@Param('id') id: string, @Body() body: CreateRefundDto) {
    return this.orders.refund(id, body);
  }
}
