import { Module } from '@nestjs/common';
import {
  PurchasesController,
  SuppliersController,
} from './suppliers.controller.js';
import { SuppliersService } from './suppliers.service.js';

@Module({
  controllers: [SuppliersController, PurchasesController],
  providers: [SuppliersService],
})
export class SuppliersModule {}
