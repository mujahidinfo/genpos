import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { SetLanguageDto, UpdateShopDto } from './shop.dto.js';

/** The app runs a single shop; its row is created on first save. */
@Injectable()
export class ShopService {
  constructor(private readonly prisma: PrismaService) {}

  get() {
    return this.prisma.shop.findFirst();
  }

  async update(input: UpdateShopDto) {
    const existing = await this.prisma.shop.findFirst();
    if (existing) {
      return this.prisma.shop.update({
        where: { id: existing.id },
        data: input,
      });
    }
    return this.prisma.shop.create({ data: input });
  }

  async setLanguage({ language }: SetLanguageDto) {
    const existing = await this.prisma.shop.findFirst();
    if (existing) {
      return this.prisma.shop.update({
        where: { id: existing.id },
        data: { language },
      });
    }
    return this.prisma.shop.create({ data: { name: 'My Shop', language } });
  }
}
