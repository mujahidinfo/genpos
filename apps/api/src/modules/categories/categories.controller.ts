import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CATALOG_EDITORS, Roles, Tenant } from '../../common/decorators.js';
import type { TenantContext } from '../../common/types.js';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto.js';
import { CategoriesService } from './categories.service.js';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list(@Tenant() tenant: TenantContext) {
    return this.categories.list(tenant);
  }

  @Roles(...CATALOG_EDITORS)
  @Post()
  create(@Tenant() tenant: TenantContext, @Body() body: CreateCategoryDto) {
    return this.categories.create(tenant, body);
  }

  @Roles(...CATALOG_EDITORS)
  @Patch(':id')
  update(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: UpdateCategoryDto,
  ) {
    return this.categories.update(tenant, id, body);
  }

  @Roles(...CATALOG_EDITORS)
  @Delete(':id')
  delete(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.categories.delete(tenant, id);
  }
}
