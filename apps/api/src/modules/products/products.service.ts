import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@genpos/db';
import type { TenantContext } from '../../common/types.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  AdjustStockDto,
  CreateProductDto,
  ListProductsQueryDto,
  UpdateProductDto,
} from './products.dto.js';

const DEFAULT_LOW_STOCK = 5;

/** Variants with this branch's stock row attached. */
const withStock = (shopId: string) =>
  ({
    category: true,
    variants: {
      orderBy: { createdAt: 'asc' },
      include: {
        inventory: {
          where: { shopId },
          select: { quantity: true, lowStock: true },
        },
      },
    },
  }) satisfies Prisma.ProductInclude;

type ProductWithStock = Prisma.ProductGetPayload<{
  include: ReturnType<typeof withStock>;
}>;

/** Flatten per-branch inventory onto each variant as `stock` / `lowStock`. */
function present<T extends ProductWithStock>(product: T) {
  return {
    ...product,
    variants: product.variants.map(({ inventory, ...v }) => ({
      ...v,
      stock: inventory[0]?.quantity ?? 0,
      lowStock: inventory[0]?.lowStock ?? DEFAULT_LOW_STOCK,
    })),
  };
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    tenant: TenantContext,
    { search, categoryId, lowStock, page, pageSize }: ListProductsQueryDto,
  ) {
    const where: Prisma.ProductWhereInput = {
      businessId: tenant.businessId,
      isActive: true,
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search } },
          { variants: { some: { barcode: { contains: search } } } },
        ],
      }),
      ...(lowStock && {
        variants: {
          some: {
            inventory: {
              some: {
                shopId: tenant.shopId,
                quantity: { lte: this.prisma.inventory.fields.lowStock },
              },
            },
          },
        },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: withStock(tenant.shopId),
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items: items.map(present), total, page, pageSize };
  }

  async getById(tenant: TenantContext, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, businessId: tenant.businessId },
      include: {
        ...withStock(tenant.shopId),
        stockMovements: {
          where: { shopId: tenant.shopId },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return present(product);
  }

  /**
   * POS scan lookup. Matches a variant barcode first, then a product barcode.
   * `matchedVariantId` tells the client which variant to add to the cart; it is
   * null only for a product-level barcode on a product with several variants.
   */
  async getByBarcode(tenant: TenantContext, barcode: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        businessId: tenant.businessId,
        barcode,
        product: { isActive: true },
      },
      select: { id: true, productId: true },
    });

    const product = await this.prisma.product.findFirst({
      where: variant
        ? { id: variant.productId }
        : { businessId: tenant.businessId, barcode, isActive: true },
      include: withStock(tenant.shopId),
    });
    if (!product) throw new NotFoundException('No product with this barcode');

    const matchedVariantId =
      variant?.id ??
      product.variants.find((v) => v.isDefault)?.id ??
      (product.variants.length === 1 ? product.variants[0].id : null);

    return { ...present(product), matchedVariantId };
  }

  async create(tenant: TenantContext, input: CreateProductDto) {
    const { variants, stock, lowStock, ...data } = input;
    await this.assertCategory(tenant, data.categoryId);
    await this.assertCodesFree(tenant, [
      data.barcode,
      ...variants.map((v) => v.barcode),
    ]);

    // Simple product → one hidden default variant that holds its stock.
    const variantRows = variants.length
      ? variants
      : [{ name: 'Default', stock, lowStock, isDefault: true as const }];

    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: { ...data, businessId: tenant.businessId },
      });
      for (const v of variantRows) {
        const { stock: qty, lowStock: low, ...variantData } = v;
        const variant = await tx.productVariant.create({
          data: {
            ...variantData,
            productId: created.id,
            businessId: tenant.businessId,
          },
        });
        await tx.inventory.create({
          data: {
            shopId: tenant.shopId,
            variantId: variant.id,
            quantity: qty,
            lowStock: low,
          },
        });
        if (qty !== 0) {
          await tx.stockMovement.create({
            data: {
              shopId: tenant.shopId,
              productId: created.id,
              variantId: variant.id,
              type: 'IN',
              quantity: qty,
              note: 'Opening stock',
            },
          });
        }
      }
      return created;
    });

    return this.getById(tenant, product.id);
  }

  async update(tenant: TenantContext, id: string, input: UpdateProductDto) {
    await this.assertCategory(tenant, input.categoryId);
    if (input.barcode) await this.assertCodesFree(tenant, [input.barcode], id);

    await this.prisma.product.update({
      where: { id, businessId: tenant.businessId },
      data: input,
    });
    return this.getById(tenant, id);
  }

  adjustStock(tenant: TenantContext, productId: string, input: AdjustStockDto) {
    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findFirst({
        where: {
          productId,
          businessId: tenant.businessId,
          ...(input.variantId ? { id: input.variantId } : { isDefault: true }),
        },
      });
      if (!variant) {
        throw new NotFoundException(
          input.variantId
            ? 'Variant not found for this product'
            : 'This product has variants — choose one',
        );
      }

      const current = await tx.inventory.findUnique({
        where: {
          shopId_variantId: { shopId: tenant.shopId, variantId: variant.id },
        },
      });
      const before = current?.quantity ?? 0;
      const after =
        input.type === 'IN' || input.type === 'RETURN'
          ? before + input.quantity
          : input.type === 'OUT'
            ? before - input.quantity
            : input.quantity; // ADJUSTMENT = set absolute (a stock count)
      if (after < 0) throw new BadRequestException('Insufficient stock');

      await tx.inventory.upsert({
        where: {
          shopId_variantId: { shopId: tenant.shopId, variantId: variant.id },
        },
        create: {
          shopId: tenant.shopId,
          variantId: variant.id,
          quantity: after,
          lowStock: input.lowStock ?? DEFAULT_LOW_STOCK,
        },
        update: {
          quantity: after,
          ...(input.lowStock !== undefined && { lowStock: input.lowStock }),
        },
      });
      await tx.stockMovement.create({
        data: {
          shopId: tenant.shopId,
          productId,
          variantId: variant.id,
          type: input.type,
          quantity: input.quantity,
          note: input.note,
        },
      });
      return { variantId: variant.id, stock: after };
    });
  }

  /** Soft delete — products are referenced by historical order items. */
  async delete(tenant: TenantContext, id: string) {
    await this.prisma.product.update({
      where: { id, businessId: tenant.businessId },
      data: { isActive: false },
    });
    return { success: true };
  }

  private async assertCategory(tenant: TenantContext, categoryId?: string) {
    if (!categoryId) return;
    const found = await this.prisma.category.findFirst({
      where: { id: categoryId, businessId: tenant.businessId },
    });
    if (!found) throw new BadRequestException('Unknown category');
  }

  /** Barcodes must be unique across products *and* variants of a business. */
  private async assertCodesFree(
    tenant: TenantContext,
    codes: (string | undefined)[],
    exceptProductId?: string,
  ) {
    const barcodes = [...new Set(codes.filter((c): c is string => !!c))];
    if (barcodes.length === 0) return;

    const clash = await this.prisma.product.findFirst({
      where: {
        businessId: tenant.businessId,
        ...(exceptProductId && { id: { not: exceptProductId } }),
        OR: [
          { barcode: { in: barcodes } },
          { variants: { some: { barcode: { in: barcodes } } } },
        ],
      },
      select: { name: true },
    });
    if (clash) {
      throw new ConflictException(
        `This barcode is already used by “${clash.name}”`,
      );
    }
  }
}
