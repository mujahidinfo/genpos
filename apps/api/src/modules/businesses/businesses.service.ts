import { Injectable } from '@nestjs/common';
import type { TenantContext } from '../../common/types.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  CreateBusinessDto,
  CreateShopDto,
  SetLanguageDto,
  UpdateShopDto,
} from './businesses.dto.js';

const shopSummary = { id: true, name: true, address: true } as const;

@Injectable()
export class BusinessesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Every business the user belongs to, with the branches they can open. */
  async listForUser(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'asc' },
      include: {
        business: {
          include: {
            shops: {
              where: { isActive: true },
              orderBy: { createdAt: 'asc' },
              select: shopSummary,
            },
          },
        },
      },
    });

    return memberships.map(({ business, role, shopId }) => ({
      id: business.id,
      name: business.name,
      currency: business.currency,
      language: business.language,
      role,
      shops: shopId
        ? business.shops.filter((s) => s.id === shopId)
        : business.shops,
    }));
  }

  /** Onboarding: business + first branch + owner membership, atomically. */
  async create(userId: string, input: CreateBusinessDto) {
    const business = await this.prisma.business.create({
      data: {
        name: input.name,
        currency: input.currency,
        language: input.language,
        shops: {
          create: {
            name: input.name,
            phone: input.phone,
            address: input.address,
          },
        },
        members: { create: { userId, role: 'OWNER' } },
      },
      include: { shops: { select: shopSummary } },
    });

    return {
      id: business.id,
      name: business.name,
      currency: business.currency,
      language: business.language,
      role: 'OWNER' as const,
      shops: business.shops,
    };
  }

  // ─── Branches (tenant-scoped) ─────────────────────────────────────────────

  listShops(tenant: TenantContext) {
    return this.prisma.shop.findMany({
      where: { businessId: tenant.businessId, isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { ...shopSummary, phone: true },
    });
  }

  addShop(tenant: TenantContext, input: CreateShopDto) {
    return this.prisma.shop.create({
      data: { ...input, businessId: tenant.businessId },
      select: { ...shopSummary, phone: true },
    });
  }

  /** The active branch, flattened with business-wide settings for clients. */
  async currentShop(tenant: TenantContext) {
    const shop = await this.prisma.shop.findUniqueOrThrow({
      where: { id: tenant.shopId },
      include: { business: true },
    });
    const { business, ...rest } = shop;
    return {
      ...rest,
      businessName: business.name,
      currency: business.currency,
      language: business.language,
      role: tenant.role,
    };
  }

  async updateCurrentShop(tenant: TenantContext, input: UpdateShopDto) {
    const { businessName, currency, language, ...shop } = input;
    await this.prisma.$transaction([
      this.prisma.shop.update({ where: { id: tenant.shopId }, data: shop }),
      this.prisma.business.update({
        where: { id: tenant.businessId },
        data: { name: businessName, currency, language },
      }),
    ]);
    return this.currentShop(tenant);
  }

  async setLanguage(tenant: TenantContext, { language }: SetLanguageDto) {
    await this.prisma.business.update({
      where: { id: tenant.businessId },
      data: { language },
    });
    return this.currentShop(tenant);
  }
}
