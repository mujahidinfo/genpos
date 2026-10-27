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
  list(@Query() query: ListProductsQueryDto) {
    return this.products.list(query);
  }

  @Get('barcode/:barcode')
  getByBarcode(@Param('barcode') barcode: string) {
    return this.products.getByBarcode(barcode);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.products.getById(id);
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() body: CreateProductDto) {
    return this.products.create(body);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateProductDto) {
    return this.products.update(id, body);
  }

  @Post(':id/stock')
  adjustStock(@Param('id') id: string, @Body() body: AdjustStockDto) {
    return this.products.adjustStock(id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.products.delete(id);
  }
}
