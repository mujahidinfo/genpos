import { Body, Controller, Get, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  MANAGERS,
  NoTenant,
  Roles,
  Tenant,
} from '../../common/decorators.js';
import type { AuthUser, TenantContext } from '../../common/types.js';
import {
  CreateBusinessDto,
  CreateShopDto,
  SetLanguageDto,
  UpdateShopDto,
} from './businesses.dto.js';
import { BusinessesService } from './businesses.service.js';

/** Account-level: which businesses/branches can I open? Create my first one. */
@ApiTags('businesses')
@ApiBearerAuth()
@NoTenant()
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businesses: BusinessesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.businesses.listForUser(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateBusinessDto) {
    return this.businesses.create(user.id, body);
  }
}

/** Branches of the active business. */
@ApiTags('shops')
@ApiBearerAuth()
@Controller('shops')
export class ShopsController {
  constructor(private readonly businesses: BusinessesService) {}

  @Get()
  list(@Tenant() tenant: TenantContext) {
    return this.businesses.listShops(tenant);
  }

  @Roles('OWNER')
  @Post()
  add(@Tenant() tenant: TenantContext, @Body() body: CreateShopDto) {
    return this.businesses.addShop(tenant, body);
  }
}

/** The active branch (X-Shop-Id). */
@ApiTags('shop')
@ApiBearerAuth()
@Controller('shop')
export class CurrentShopController {
  constructor(private readonly businesses: BusinessesService) {}

  @Get()
  get(@Tenant() tenant: TenantContext) {
    return this.businesses.currentShop(tenant);
  }

  @Roles(...MANAGERS)
  @Put()
  update(@Tenant() tenant: TenantContext, @Body() body: UpdateShopDto) {
    return this.businesses.updateCurrentShop(tenant, body);
  }

  @Roles(...MANAGERS)
  @Patch('language')
  setLanguage(@Tenant() tenant: TenantContext, @Body() body: SetLanguageDto) {
    return this.businesses.setLanguage(tenant, body);
  }
}
