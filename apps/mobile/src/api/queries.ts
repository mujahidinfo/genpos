import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  AnalyticsOverview,
  Customer,
  Order,
  OrderStatus,
  Paginated,
  PaymentMethod,
  Product,
  ProductDetail,
  ScannedProduct,
  ShopSummary,
  SalesChartPoint,
  Shop,
  TopProduct,
} from '@/api/types';
import { ApiError, api } from '@/lib/api-client';

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

// ─── POS ─────────────────────────────────────────────────────────────────────

/** Barcode lookup for the scanner. Resolves null when no product has the code. */
export async function findByBarcode(barcode: string): Promise<ScannedProduct | null> {
  try {
    return await api<ScannedProduct>(`/products/barcode/${encodeURIComponent(barcode)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export type NewProductInput = {
  name: string;
  price: number;
  costPrice?: number;
  barcode?: string;
  stock?: number;
  categoryId?: string;
};

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewProductInput) =>
      api<Product>('/products', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export type NewOrderInput = {
  items: {
    productId: string;
    variantId: string;
    name: string;
    sku?: string;
    price: number;
    quantity: number;
  }[];
  paymentMethod: PaymentMethod;
  amountTendered?: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  taxRate: number;
  customerId?: string;
};

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewOrderInput) => api<Order>('/orders', { method: 'POST', body: input }),
    onSuccess: () =>
      Promise.all(
        [['orders'], ['products'], ['analytics']].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });
}

export function useFindOrCreateCustomer() {
  return useMutation({
    mutationFn: (input: { phone: string; name: string }) =>
      api<Customer>('/customers/find-or-create', { method: 'POST', body: input }),
  });
}

export function useCustomerLookup(phone: string) {
  const trimmed = phone.trim();
  return useQuery({
    queryKey: ['customers', 'lookup', trimmed],
    queryFn: () => api<Customer | null>('/customers/lookup', { query: { phone: trimmed } }),
    enabled: trimmed.length >= 6,
  });
}

// ─── Branches ────────────────────────────────────────────────────────────────

export function useAddShop() {
  return useMutation({
    mutationFn: (input: { name: string; phone?: string; address?: string }) =>
      api<ShopSummary>('/shops', { method: 'POST', body: input }),
  });
}
