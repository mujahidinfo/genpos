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
  CATALOG_EDITORS,
  CurrentUser,
  MANAGERS,
  Roles,
  Tenant,
} from '../../common/decorators.js';
import type { AuthUser, TenantContext } from '../../common/types.js';
import {
  CreatePurchaseDto,
  CreateSupplierDto,
  CreateSupplierPaymentDto,
  ListPurchasesQueryDto,
  ListSuppliersQueryDto,
  ReorderQueryDto,
  UpdateSupplierDto,
} from './suppliers.dto.js';
import { SuppliersService } from './suppliers.service.js';

/** Business-wide supplier list with balances owed. */
@ApiTags('suppliers')
@ApiBearerAuth()
@Roles(...CATALOG_EDITORS)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get()
  list(@Tenant() tenant: TenantContext, @Query() query: ListSuppliersQueryDto) {
    return this.suppliers.list(tenant, query);
  }

  @Get(':id')
  getById(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.suppliers.getById(tenant, id);
  }

  @Post()
  create(@Tenant() tenant: TenantContext, @Body() body: CreateSupplierDto) {
    return this.suppliers.create(tenant, body);
  }

  @Patch(':id')
  update(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: UpdateSupplierDto,
  ) {
    return this.suppliers.update(tenant, id, body);
  }

  /** Paying a supplier is money leaving the business: owners/managers only. */
  @Roles(...MANAGERS)
  @Post(':id/payments')
  addPayment(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: CreateSupplierPaymentDto,
  ) {
    return this.suppliers.addPayment(tenant, id, body);
  }
}

/** Stock received into the active branch. */
@ApiTags('purchases')
@ApiBearerAuth()
@Roles(...CATALOG_EDITORS)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get()
  list(@Tenant() tenant: TenantContext, @Query() query: ListPurchasesQueryDto) {
    return this.suppliers.listPurchases(tenant, query);
  }

  /** Low-stock items with their usual supplier — feeds “Reorder”. Before :id. */
  @Get('reorder')
  reorder(@Tenant() tenant: TenantContext, @Query() query: ReorderQueryDto) {
    return this.suppliers.reorderSuggestions(tenant, query);
  }

  @Get(':id')
  getById(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.suppliers.getPurchase(tenant, id);
  }

  @Post()
  create(
    @Tenant() tenant: TenantContext,
    @Body() body: CreatePurchaseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.suppliers.createPurchase(tenant, body, user.id);
  }
}
