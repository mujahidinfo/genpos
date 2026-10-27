import { Body, Controller, Get, Patch, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators.js';
import { SetLanguageDto, UpdateShopDto } from './shop.dto.js';
import { ShopService } from './shop.service.js';

@ApiTags('shop')
@ApiBearerAuth()
@Controller('shop')
export class ShopController {
  constructor(private readonly shop: ShopService) {}

  @Get()
  get() {
    return this.shop.get();
  }

  @Roles('ADMIN')
  @Put()
  update(@Body() body: UpdateShopDto) {
    return this.shop.update(body);
  }

  @Roles('ADMIN')
  @Patch('language')
  setLanguage(@Body() body: SetLanguageDto) {
    return this.shop.setLanguage(body);
  }
}
