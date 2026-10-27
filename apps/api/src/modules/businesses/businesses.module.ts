import { Module } from '@nestjs/common';
import {
  BusinessesController,
  CurrentShopController,
  ShopsController,
} from './businesses.controller.js';
import { BusinessesService } from './businesses.service.js';

@Module({
  controllers: [BusinessesController, ShopsController, CurrentShopController],
  providers: [BusinessesService],
})
export class BusinessesModule {}
