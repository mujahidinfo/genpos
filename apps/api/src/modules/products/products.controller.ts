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
import { CATALOG_EDITORS, Roles, Tenant } from '../../common/decorators.js';
import type { TenantContext } from '../../common/types.js';
import {
  AdjustStockDto,
  CreateProductDto,
  ListProductsQueryDto,
  UpdateProductDto,
} from './products.dto.js';
import { ProductsService } from './products.service.js';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Tenant() tenant: TenantContext, @Query() query: ListProductsQueryDto) {
    return this.products.list(tenant, query);
  }

  @Get('barcode/:barcode')
  getByBarcode(
    @Tenant() tenant: TenantContext,
    @Param('barcode') barcode: string,
  ) {
    return this.products.getByBarcode(tenant, barcode);
  }

  @Get(':id')
  getById(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.products.getById(tenant, id);
  }

  @Roles(...CATALOG_EDITORS)
  @Post()
  create(@Tenant() tenant: TenantContext, @Body() body: CreateProductDto) {
    return this.products.create(tenant, body);
  }

  @Roles(...CATALOG_EDITORS)
  @Patch(':id')
  update(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
  ) {
    return this.products.update(tenant, id, body);
  }

  @Roles(...CATALOG_EDITORS)
  @Post(':id/stock')
  adjustStock(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: AdjustStockDto,
  ) {
    return this.products.adjustStock(tenant, id, body);
  }

  @Roles(...CATALOG_EDITORS)
  @Delete(':id')
  delete(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.products.delete(tenant, id);
  }
}
