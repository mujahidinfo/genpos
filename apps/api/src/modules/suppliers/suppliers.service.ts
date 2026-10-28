import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@genpos/db';
import type { TenantContext } from '../../common/types.js';
import { generatePurchaseNumber, round2 } from '../../common/utils.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  CreatePurchaseDto,
  CreateSupplierDto,
  CreateSupplierPaymentDto,
  ListPurchasesQueryDto,
  ListSuppliersQueryDto,
  ReorderQueryDto,
  UpdateSupplierDto,
} from './suppliers.dto.js';

const purchaseInclude = {
  supplier: { select: { id: true, name: true } },
  receivedBy: { select: { id: true, name: true } },
  items: true,
  payments: true,
} satisfies Prisma.PurchaseInclude;

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Suppliers ──────────────────────────────────────────────────────────

  /** Suppliers with what has been bought from them and what is still owed. */
  async list(tenant: TenantContext, query: ListSuppliersQueryDto) {
    const suppliers = await this.prisma.supplier.findMany({
      where: {
        businessId: tenant.businessId,
        ...(!query.includeInactive && { isActive: true }),
        ...(query.search && {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { phone: { contains: query.search } },
          ],
        }),
      },
      orderBy: { name: 'asc' },
    });
    const balances = await this.balances(
      tenant,
      suppliers.map((s) => s.id),
    );
    return suppliers.map((s) => ({ ...s, ...balances.get(s.id)! }));
  }

  async getById(tenant: TenantContext, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, businessId: tenant.businessId },
      include: {
        purchases: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { shop: { select: { id: true, name: true } } },
        },
        payments: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    const balance = (await this.balances(tenant, [id])).get(id)!;
    return { ...supplier, ...balance };
  }

  create(tenant: TenantContext, input: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: { ...input, businessId: tenant.businessId },
    });
  }

  update(tenant: TenantContext, id: string, input: UpdateSupplierDto) {
    return this.prisma.supplier.update({
      where: { id, businessId: tenant.businessId },
      data: input,
    });
  }

  async addPayment(
    tenant: TenantContext,
    supplierId: string,
    input: CreateSupplierPaymentDto,
  ) {
    await this.assertSupplier(tenant, supplierId);
    await this.prisma.supplierPayment.create({
      data: { ...input, supplierId, businessId: tenant.businessId },
    });
    return this.getById(tenant, supplierId);
  }

  // ─── Purchases (stock received into the active branch) ──────────────────

  async listPurchases(
    tenant: TenantContext,
    { supplierId, page, pageSize }: ListPurchasesQueryDto,
  ) {
    const where: Prisma.PurchaseWhereInput = {
      shopId: tenant.shopId,
      ...(supplierId && { supplierId }),
    };
    const [items, total] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        include: purchaseInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.purchase.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async getPurchase(tenant: TenantContext, id: string) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id, shopId: tenant.shopId },
      include: purchaseInclude,
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }

  /**
   * Receive stock: adds the quantities to this branch's inventory, records the
   * purchase (and any payment made now) and optionally updates cost prices.
   */
  async createPurchase(
    tenant: TenantContext,
    input: CreatePurchaseDto,
    userId: string,
  ) {
    if (input.supplierId) await this.assertSupplier(tenant, input.supplierId);

    const products = await this.prisma.product.findMany({
      where: {
        businessId: tenant.businessId,
        id: { in: [...new Set(input.items.map((i) => i.productId))] },
      },
      include: {
        variants: { select: { id: true, isDefault: true, name: true } },
      },
    });

    const lines = input.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new BadRequestException('Unknown product');
      const variant = item.variantId
        ? product.variants.find((v) => v.id === item.variantId)
        : (product.variants.find((v) => v.isDefault) ??
          (product.variants.length === 1 ? product.variants[0] : undefined));
      if (!variant) {
        throw new BadRequestException(`Choose a variant for ${product.name}`);
      }
      return {
        product,
        variantId: variant.id,
        name: variant.isDefault
          ? product.name
          : `${product.name} (${variant.name})`,
        quantity: item.quantity,
        unitCost: item.unitCost,
        total: round2(item.quantity * item.unitCost),
      };
    });

    const total = round2(lines.reduce((s, l) => s + l.total, 0));
    if (input.paidAmount > total) {
      throw new BadRequestException(
        'Paid amount is more than the purchase total',
      );
    }
    const purchaseNumber = generatePurchaseNumber();
    const purchase = await this.prisma.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          purchaseNumber,
          businessId: tenant.businessId,
          shopId: tenant.shopId,
          supplierId: input.supplierId,
          receivedById: userId,
          total,
          note: input.note,
          items: {
            create: lines.map((l) => ({
              productId: l.product.id,
              variantId: l.variantId,
              name: l.name,
              quantity: l.quantity,
              unitCost: l.unitCost,
              total: l.total,
            })),
          },
        },
      });

      for (const line of lines) {
        const key = { shopId: tenant.shopId, variantId: line.variantId };
        await tx.inventory.upsert({
          where: { shopId_variantId: key },
          create: { ...key, quantity: line.quantity },
          update: { quantity: { increment: line.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            ...key,
            productId: line.product.id,
            type: 'IN',
            quantity: line.quantity,
            note: `Purchase ${purchaseNumber}`,
          },
        });
        if (input.updateCostPrice && line.unitCost > 0) {
          await tx.product.update({
            where: { id: line.product.id },
            data: { costPrice: line.unitCost },
          });
        }
      }

      if (input.supplierId && input.paidAmount > 0) {
        await tx.supplierPayment.create({
          data: {
            businessId: tenant.businessId,
            supplierId: input.supplierId,
            purchaseId: created.id,
            amount: input.paidAmount,
            paymentMethod: input.paymentMethod,
          },
        });
      }
      return created;
    });

    return this.getPurchase(tenant, purchase.id);
  }

  /**
   * What to reorder in the active branch: items at or below their alert level,
   * with the supplier and cost of their last delivery and a suggested quantity
   * (enough to get back to twice the alert level).
   */
  async reorderSuggestions(
    tenant: TenantContext,
    { supplierId }: ReorderQueryDto,
  ) {
    const low = await this.prisma.inventory.findMany({
      where: {
        shopId: tenant.shopId,
        quantity: { lte: this.prisma.inventory.fields.lowStock },
        variant: { product: { isActive: true } },
      },
      include: {
        variant: {
          select: {
            id: true,
            name: true,
            isDefault: true,
            product: { select: { id: true, name: true, costPrice: true } },
          },
        },
      },
      orderBy: { quantity: 'asc' },
      take: 200,
    });

    const lastItems = await this.prisma.purchaseItem.findMany({
      where: {
        variantId: { in: low.map((l) => l.variantId) },
        purchase: { businessId: tenant.businessId },
      },
      orderBy: { purchase: { createdAt: 'desc' } },
      select: {
        variantId: true,
        unitCost: true,
        purchase: {
          select: { supplier: { select: { id: true, name: true } } },
        },
      },
    });
    // Newest first, so the first hit per variant is its last delivery.
    const lastByVariant = new Map<string, (typeof lastItems)[number]>();
    for (const item of lastItems) {
      if (!lastByVariant.has(item.variantId))
        lastByVariant.set(item.variantId, item);
    }

    return low
      .map(({ variant, quantity, lowStock }) => {
        const last = lastByVariant.get(variant.id);
        return {
          productId: variant.product.id,
          variantId: variant.id,
          name: variant.isDefault
            ? variant.product.name
            : `${variant.product.name} (${variant.name})`,
          stock: quantity,
          lowStock,
          suggestedQuantity: Math.max(lowStock * 2 - quantity, 1),
          unitCost: last?.unitCost ?? variant.product.costPrice,
          supplier: last?.purchase.supplier ?? null,
        };
      })
      .filter((item) => !supplierId || item.supplier?.id === supplierId);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  private async assertSupplier(tenant: TenantContext, id: string) {
    const found = await this.prisma.supplier.findFirst({
      where: { id, businessId: tenant.businessId },
    });
    if (!found) throw new BadRequestException('Unknown supplier');
  }

  /** totalPurchased / totalPaid / due per supplier (business-wide). */
  private async balances(tenant: TenantContext, ids: string[]) {
    const [bought, paid] = await Promise.all([
      this.prisma.purchase.groupBy({
        by: ['supplierId'],
        where: { businessId: tenant.businessId, supplierId: { in: ids } },
        _sum: { total: true },
      }),
      this.prisma.supplierPayment.groupBy({
        by: ['supplierId'],
        where: { businessId: tenant.businessId, supplierId: { in: ids } },
        _sum: { amount: true },
      }),
    ]);
    return new Map(
      ids.map((id) => {
        const totalPurchased = round2(
          bought.find((b) => b.supplierId === id)?._sum.total ?? 0,
        );
        const totalPaid = round2(
          paid.find((p) => p.supplierId === id)?._sum.amount ?? 0,
        );
        return [
          id,
          {
            totalPurchased,
            totalPaid,
            due: round2(totalPurchased - totalPaid),
          },
        ];
      }),
    );
  }
}
