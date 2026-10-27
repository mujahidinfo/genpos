import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import type {
  AnalyticsOverview,
  Order,
  OrderStatus,
  Paginated,
  Product,
  ProductDetail,
  SalesChartPoint,
  Shop,
  TopProduct,
} from '@/api/types';
import { api } from '@/lib/api-client';

const PAGE_SIZE = 20;

const nextPage = <T>(last: Paginated<T>) =>
  last.page * last.pageSize < last.total ? last.page + 1 : undefined;

export function useShop() {
  return useQuery({
    queryKey: ['shop'],
    queryFn: () => api<Shop | null>('/shop'),
    staleTime: 5 * 60_000,
  });
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export function useAnalyticsOverview(days: number) {
  return useQuery({
    queryKey: ['analytics', 'overview', days],
    queryFn: () => api<AnalyticsOverview>('/analytics/overview', { query: { days } }),
  });
}

export function useSalesChart(days: number) {
  return useQuery({
    queryKey: ['analytics', 'sales-chart', days],
    queryFn: () => api<SalesChartPoint[]>('/analytics/sales-chart', { query: { days } }),
  });
}

export function useTopProducts(days: number, limit = 5) {
  return useQuery({
    queryKey: ['analytics', 'top-products', days, limit],
    queryFn: () => api<TopProduct[]>('/analytics/top-products', { query: { days, limit } }),
  });
}

// ─── Products ────────────────────────────────────────────────────────────────

export function useProducts(search: string) {
  return useInfiniteQuery({
    queryKey: ['products', 'list', search],
    queryFn: ({ pageParam }) =>
      api<Paginated<Product>>('/products', {
        query: { search, page: pageParam, pageSize: PAGE_SIZE },
      }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', 'detail', id],
    queryFn: () => api<ProductDetail>(`/products/${id}`),
  });
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export function useOrders(filters: { search: string; status?: OrderStatus }) {
  return useInfiniteQuery({
    queryKey: ['orders', 'list', filters],
    queryFn: ({ pageParam }) =>
      api<Paginated<Order>>('/orders', {
        query: { ...filters, page: pageParam, pageSize: PAGE_SIZE },
      }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: () => api<Order>(`/orders/${id}`),
  });
}
