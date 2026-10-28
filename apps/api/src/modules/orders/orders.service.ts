import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@genpos/db';
import type { TenantContext } from '../../common/types.js';
import { generateOrderNumber, round2 } from '../../common/utils.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  CreateOrderDto,
  CreateRefundDto,
  ListOrdersQueryDto,
  UpdateOrderStatusDto,
} from './orders.dto.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    tenant: TenantContext,
    { status, search, from, to, page, pageSize }: ListOrdersQueryDto,
  ) {
    const where: Prisma.OrderWhereInput = {
      shopId: tenant.shopId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { customer: { phone: { contains: search } } },
        ],
      }),
      ...((from || to) && {
        createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          customer: true,
          cashier: { select: { id: true, name: true } },
          items: { include: { product: true } },
          refunds: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        // Newest first; id breaks ties so paging never repeats or skips a sale.
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async getById(tenant: TenantContext, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, shopId: tenant.shopId },
      include: {
        customer: true,
        cashier: { select: { id: true, name: true } },
        items: { include: { product: true, variant: true } },
        refunds: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(
    tenant: TenantContext,
    input: CreateOrderDto,
    cashierId: string,
  ) {
    const [shop, products] = await Promise.all([
      this.prisma.shop.findUniqueOrThrow({ where: { id: tenant.shopId } }),
      this.prisma.product.findMany({
        where: {
          businessId: tenant.businessId,
          id: { in: [...new Set(input.items.map((i) => i.productId))] },
        },
        include: { variants: { select: { id: true, isDefault: true } } },
      }),
    ]);
    if (input.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: input.customerId, businessId: tenant.businessId },
      });
      if (!customer) throw new BadRequestException('Unknown customer');
    }

    // Every line sells a concrete variant so stock always moves.
    const lines = input.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product)
        throw new BadRequestException(`Unknown product: ${item.name}`);
      const variantId = item.variantId
        ? product.variants.find((v) => v.id === item.variantId)?.id
        : (
            product.variants.find((v) => v.isDefault) ??
            (product.variants.length === 1 ? product.variants[0] : undefined)
          )?.id;
      if (!variantId) {
        throw new BadRequestException(`Choose a variant for ${item.name}`);
      }
      return { ...item, variantId };
    });

    const subtotal = lines.reduce((s, i) => s + i.price * i.quantity, 0);
    let discountAmt = 0;
    if (input.discountType === 'percentage') {
      discountAmt = subtotal * (Math.min(input.discountValue, 100) / 100);
    } else if (input.discountType === 'fixed') {
      discountAmt = input.discountValue;
    }
    // Never let a discount exceed the subtotal — that would book a negative order.
    discountAmt = round2(Math.min(discountAmt, subtotal));
    const taxableAmount = subtotal - discountAmt;
    const taxAmt = round2(taxableAmount * (input.taxRate / 100));
    const total = round2(taxableAmount + taxAmt);

    // Stock deduction and order creation succeed or fail together.
    return this.prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const key = { shopId: tenant.shopId, variantId: line.variantId };
        if (shop.allowNegativeStock) {
          // Never block a sale at the counter; a negative count flags a recount.
          await tx.inventory.upsert({
            where: { shopId_variantId: key },
            create: { ...key, quantity: -line.quantity },
            update: { quantity: { decrement: line.quantity } },
          });
        } else {
          // Conditional decrement: atomic, so concurrent sales can't oversell.
          const { count } = await tx.inventory.updateMany({
            where: { ...key, quantity: { gte: line.quantity } },
            data: { quantity: { decrement: line.quantity } },
          });
          if (count === 0) {
            throw new BadRequestException(
              `Insufficient stock for ${line.name}`,
            );
          }
        }
        await tx.stockMovement.create({
          data: {
            ...key,
            productId: line.productId,
            type: 'OUT',
            quantity: line.quantity,
            note: 'Sale',
          },
        });
      }

      return tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          businessId: tenant.businessId,
          shopId: tenant.shopId,
          cashierId,
          customerId: input.customerId,
          type: input.type,
          status: input.status,
          subtotal,
          discountType: input.discountType,
          discountValue: input.discountValue,
          discountAmt,
          taxRate: input.taxRate,
          taxAmt,
          total,
          paymentMethod: input.paymentMethod,
          amountTendered: input.amountTendered,
          note: input.note,
          items: {
            create: lines.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              name: i.name,
              sku: i.sku,
              price: i.price,
              quantity: i.quantity,
              total: i.price * i.quantity,
            })),
          },
        },
        include: {
          customer: true,
          cashier: { select: { id: true, name: true } },
          items: { include: { product: true, variant: true } },
          refunds: true,
        },
      });
    });
  }

  updateStatus(
    tenant: TenantContext,
    id: string,
    { status }: UpdateOrderStatusDto,
  ) {
    return this.prisma.order.update({
      where: { id, shopId: tenant.shopId },
      data: { status },
    });
  }

  refund(tenant: TenantContext, orderId: string, input: CreateRefundDto) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, shopId: tenant.shopId },
      });
      if (!order) throw new NotFoundException('Order not found');
      const existing = await tx.refund.aggregate({
        where: { orderId },
        _sum: { amount: true },
      });
      const totalRefunded = existing._sum.amount ?? 0;
      if (totalRefunded + input.amount > order.total) {
        throw new BadRequestException('Refund exceeds order total');
      }

      const refund = await tx.refund.create({ data: { orderId, ...input } });
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'REFUNDED' },
      });
      return refund;
    });
  }
}
