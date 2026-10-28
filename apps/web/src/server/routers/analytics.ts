import { z } from "zod";
import { router, protectedProcedure } from "@/lib/trpc/server";
import type {
  AnalyticsOverview,
  CategoryRevenue,
  SalesChartPoint,
  TopProduct,
} from "@/server/api-types";

const days = z.object({ days: z.number().default(30) }).optional();

export const analyticsRouter = router({
  overview: protectedProcedure
    .input(days)
    .query(({ input, ctx }) => ctx.api<AnalyticsOverview>("/analytics/overview", { query: input })),

  salesChart: protectedProcedure
    .input(days)
    .query(({ input, ctx }) => ctx.api<SalesChartPoint[]>("/analytics/sales-chart", { query: input })),

  topProducts: protectedProcedure
    .input(z.object({ limit: z.number().default(10), days: z.number().default(30) }).optional())
    .query(({ input, ctx }) => ctx.api<TopProduct[]>("/analytics/top-products", { query: input })),

  revenueByCategory: protectedProcedure
    .input(days)
    .query(({ input, ctx }) =>
      ctx.api<CategoryRevenue[]>("/analytics/revenue-by-category", { query: input }),
    ),
});
