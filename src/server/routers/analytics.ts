import { z } from "zod";
import { router, protectedProcedure } from "@/lib/trpc/server";
import { prisma } from "@/lib/prisma";
import {
  startOfDay,
  endOfDay,
  subDays,
  eachDayOfInterval,
  format,
} from "date-fns";

export const analyticsRouter = router({
  overview: protectedProcedure
    .input(z.object({ days: z.number().default(30) }).optional())
    .query(async ({ input }) => {
      const days = input?.days ?? 30;
      const from = startOfDay(subDays(new Date(), days - 1));
      const to = endOfDay(new Date());

      const [
        totalSales,
        totalOrders,
        totalProducts,
        totalCustomers,
        lowStockCount,
      ] = await Promise.all([
        prisma.order.aggregate({
          where: { status: "FULFILLED", createdAt: { gte: from, lte: to } },
          _sum: { total: true },
          _count: true,
        }),
        prisma.order.count({ where: { createdAt: { gte: from, lte: to } } }),
        prisma.product.count({ where: { isActive: true } }),
        prisma.customer.count(),
        prisma.productVariant.count({ where: { stock: { lte: 5 } } }),
      ]);

      return {
        totalRevenue: totalSales._sum.total ?? 0,
        fulfilledOrders: totalSales._count,
        totalOrders,
        totalProducts,
        totalCustomers,
        lowStockCount,
      };
    }),

  salesChart: protectedProcedure
    .input(z.object({ days: z.number().default(30) }).optional())
    .query(async ({ input }) => {
      const days = input?.days ?? 30;
      const from = startOfDay(subDays(new Date(), days - 1));
      const to = endOfDay(new Date());

      const orders = await prisma.order.findMany({
        where: { status: "FULFILLED", createdAt: { gte: from, lte: to } },
        select: { total: true, createdAt: true },
      });

      const interval = eachDayOfInterval({ start: from, end: to });
      const chartData = interval.map((day) => {
        const dayStr = format(day, "MMM d");
        const dayTotal = orders
          .filter((o) => format(new Date(o.createdAt), "MMM d") === dayStr)
          .reduce((s, o) => s + o.total, 0);
        return { date: dayStr, revenue: parseFloat(dayTotal.toFixed(2)) };
      });

      return chartData;
    }),

  topProducts: protectedProcedure
    .input(
      z
        .object({ limit: z.number().default(10), days: z.number().default(30) })
        .optional(),
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? 10;
      const days = input?.days ?? 30;
      const from = subDays(new Date(), days);

      const items = await prisma.orderItem.groupBy({
        by: ["productId", "name"],
        where: { order: { createdAt: { gte: from }, status: "FULFILLED" } },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: "desc" } },
        take: limit,
      });

      return items.map((i) => ({
        productId: i.productId,
        name: i.name,
        totalQty: i._sum.quantity ?? 0,
        totalRevenue: i._sum.total ?? 0,
      }));
    }),

  revenueByCategory: protectedProcedure
    .input(z.object({ days: z.number().default(30) }).optional())
    .query(async ({ input }) => {
      const days = input?.days ?? 30;
      const from = subDays(new Date(), days);

      const items = await prisma.orderItem.findMany({
        where: { order: { createdAt: { gte: from }, status: "FULFILLED" } },
        include: { product: { include: { category: true } } },
      });

      const categoryMap = new Map<string, { name: string; revenue: number }>();
      for (const item of items) {
        const catName = item.product.category?.name ?? "Uncategorized";
        const catId = item.product.categoryId ?? "none";
        const existing = categoryMap.get(catId) ?? {
          name: catName,
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
    }),
});
