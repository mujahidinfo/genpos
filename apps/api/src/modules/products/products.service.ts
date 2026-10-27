import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@genpos/db';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  AdjustStockDto,
  CreateProductDto,
  ListProductsQueryDto,
  UpdateProductDto,
} from './products.dto.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list({
    search,
    categoryId,
    lowStock,
    page,
    pageSize,
  }: ListProductsQueryDto) {
    const where: Prisma.ProductWhereInput = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          variants: true,
          _count: { select: { orderItems: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Prisma can't compare two columns (stock <= lowStock), so this filters the
    // current page in memory — same behaviour as the original tRPC router.
    const filteredItems = lowStock
      ? items.filter((p) => p.variants.some((v) => v.stock <= v.lowStock))
      : items;

    return { items: filteredItems, total, page, pageSize };
  }

  async getById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        stockMovements: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async getByBarcode(barcode: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ barcode }, { variants: { some: { barcode } } }],
      },
      include: { category: true, variants: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  create({ variants, ...productData }: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...productData,
        variants: variants.length > 0 ? { create: variants } : undefined,
      },
      include: { category: true, variants: true },
    });
  }

  update(id: string, input: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: input,
      include: { category: true, variants: true },
    });
  }

  adjustStock(productId: string, input: AdjustStockDto) {
    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: input.variantId },
      });
      if (!variant || variant.productId !== productId) {
        throw new NotFoundException('Variant not found for this product');
      }

      let newStock = variant.stock;
      if (input.type === 'IN' || input.type === 'RETURN') {
        newStock += input.quantity;
      } else if (input.type === 'OUT') {
        newStock -= input.quantity;
      } else {
        newStock = input.quantity; // ADJUSTMENT = set absolute
      }
      if (newStock < 0) throw new BadRequestException('Insufficient stock');

      await tx.productVariant.update({
        where: { id: input.variantId },
        data: { stock: newStock },
      });
      await tx.stockMovement.create({
        data: {
          productId,
          variantId: input.variantId,
          type: input.type,
          quantity: input.quantity,
          note: input.note,
        },
      });
      return { stock: newStock };
    });
  }

  /** Soft delete — products are referenced by historical order items. */
  delete(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
