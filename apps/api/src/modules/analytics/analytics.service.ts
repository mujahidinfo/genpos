import { Injectable } from '@nestjs/common';
import {
  eachDayOfInterval,
  endOfDay,
  format,
  startOfDay,
  subDays,
} from 'date-fns';
import { round2 } from '../../common/utils.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(days: number) {
    const from = startOfDay(subDays(new Date(), days - 1));
    const to = endOfDay(new Date());

    const [
      totalSales,
      totalOrders,
      totalProducts,
      totalCustomers,
      lowStockCount,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { status: 'FULFILLED', createdAt: { gte: from, lte: to } },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.order.count({ where: { createdAt: { gte: from, lte: to } } }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.customer.count(),
      this.prisma.productVariant.count({ where: { stock: { lte: 5 } } }),
    ]);

    return {
      totalRevenue: totalSales._sum.total ?? 0,
      fulfilledOrders: totalSales._count,
      totalOrders,
      totalProducts,
      totalCustomers,
      lowStockCount,
    };
  }

  async salesChart(days: number) {
    const from = startOfDay(subDays(new Date(), days - 1));
    const to = endOfDay(new Date());

    const orders = await this.prisma.order.findMany({
      where: { status: 'FULFILLED', createdAt: { gte: from, lte: to } },
      select: { total: true, createdAt: true },
    });

    const totalsByDay = new Map<string, number>();
    for (const o of orders) {
      const key = format(o.createdAt, 'MMM d');
      totalsByDay.set(key, (totalsByDay.get(key) ?? 0) + o.total);
    }

    return eachDayOfInterval({ start: from, end: to }).map((day) => {
      const date = format(day, 'MMM d');
      return { date, revenue: round2(totalsByDay.get(date) ?? 0) };
    });
  }

  async topProducts(days: number, limit: number) {
    const from = subDays(new Date(), days);

    const items = await this.prisma.orderItem.groupBy({
      by: ['productId', 'name'],
      where: { order: { createdAt: { gte: from }, status: 'FULFILLED' } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });

    return items.map((i) => ({
      productId: i.productId,
      name: i.name,
      totalQty: i._sum.quantity ?? 0,
      totalRevenue: i._sum.total ?? 0,
    }));
  }

  async revenueByCategory(days: number) {
    const from = subDays(new Date(), days);

    const items = await this.prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: from }, status: 'FULFILLED' } },
      include: { product: { include: { category: true } } },
    });

    const categoryMap = new Map<string, { name: string; revenue: number }>();
    for (const item of items) {
      const catId = item.product.categoryId ?? 'none';
      const existing = categoryMap.get(catId) ?? {
        name: item.product.category?.name ?? 'Uncategorized',
        revenue: 0,
      };
      categoryMap.set(catId, {
        ...existing,
        revenue: existing.revenue + item.total,
      });
    }

    return Array.from(categoryMap.values()).sort(
      (a, b) => b.revenue - a.revenue,
    );
  }
}
