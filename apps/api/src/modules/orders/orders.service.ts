import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@genpos/db';
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

  async list({ status, search, from, to, page, pageSize }: ListOrdersQueryDto) {
    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (from || to) {
      where.createdAt = {
        ...(from && { gte: from }),
        ...(to && { lte: to }),
      };
    }

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
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async getById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
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

  create(input: CreateOrderDto, cashierId: string) {
    const subtotal = input.items.reduce((s, i) => s + i.price * i.quantity, 0);
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
      for (const item of input.items) {
        if (!item.variantId) continue;
        // Conditional decrement: atomic, so concurrent sales can't oversell.
        const { count } = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (count === 0) {
          throw new BadRequestException(`Insufficient stock for ${item.name}`);
        }
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            type: 'OUT',
            quantity: item.quantity,
            note: 'Sale',
          },
        });
      }

      return tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
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
          note: input.note,
          items: {
            create: input.items.map((i) => ({
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
          items: { include: { product: true } },
        },
      });
    });
  }

  updateStatus(id: string, { status }: UpdateOrderStatusDto) {
    return this.prisma.order.update({ where: { id }, data: { status } });
  }

  refund(orderId: string, input: CreateRefundDto) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
      });
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
