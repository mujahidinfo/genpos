import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  AnalyticsOverview,
  Customer,
  Expense,
  ExpenseCategory,
  Order,
  OrderStatus,
  Paginated,
  PaymentMethod,
  Product,
  Role,
  ProductDetail,
  ScannedProduct,
  Member,
  Purchase,
  ShopSummary,
  Supplier,
  SupplierDetail,
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

// ─── Staff ───────────────────────────────────────────────────────────────────

export function useMembers() {
  return useQuery({ queryKey: ['members'], queryFn: () => api<Member[]>('/members') });
}

export type MemberInput = {
  name: string;
  email: string;
  password?: string;
  role: Role;
  shopId?: string;
};

export function useAddMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MemberInput) => api<Member>('/members', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; role?: Role; isActive?: boolean; shopId?: string | null }) =>
      api<Member>(`/members/${id}`, { method: 'PATCH', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  });
}

// ─── Suppliers & purchases ───────────────────────────────────────────────────

export function useSuppliers() {
  return useQuery({ queryKey: ['suppliers', 'list'], queryFn: () => api<Supplier[]>('/suppliers') });
}

export function useSupplier(id: string | undefined) {
  return useQuery({
    queryKey: ['suppliers', 'detail', id],
    queryFn: () => api<SupplierDetail>(`/suppliers/${id}`),
    enabled: !!id,
  });
}

export type SupplierInput = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
};

export function useSaveSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: SupplierInput & { id?: string }) =>
      id
        ? api<Supplier>(`/suppliers/${id}`, { method: 'PATCH', body: input })
        : api<Supplier>('/suppliers', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function usePaySupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ supplierId, ...input }: { supplierId: string; amount: number; paymentMethod: PaymentMethod; note?: string }) =>
      api<SupplierDetail>(`/suppliers/${supplierId}/payments`, { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export type PurchaseInput = {
  supplierId?: string;
  items: { productId: string; variantId: string; quantity: number; unitCost: number }[];
  paidAmount: number;
  paymentMethod: PaymentMethod;
  note?: string;
};

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PurchaseInput) => api<Purchase>('/purchases', { method: 'POST', body: input }),
    onSuccess: () =>
      Promise.all(
        [['products'], ['suppliers'], ['analytics']].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });
}

// ─── Expenses (owner/manager) ────────────────────────────────────────────────

export function useExpenses() {
  return useInfiniteQuery({
    queryKey: ['expenses', 'list'],
    queryFn: ({ pageParam }) =>
      api<Paginated<Expense>>('/finance/expenses', { query: { page: pageParam, pageSize: PAGE_SIZE } }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  });
}

export function useExpenseTotal(days: number) {
  return useQuery({
    queryKey: ['expenses', 'total', days],
    queryFn: () =>
      api<{ totalExpenses: number; totalIncome: number; netProfit: number }>('/finance/overview', {
        query: { days },
      }),
  });
}

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expenses', 'categories'],
    queryFn: () => api<ExpenseCategory[]>('/finance/expense-categories'),
    staleTime: 5 * 60_000,
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; color: string }) =>
      api<ExpenseCategory>('/finance/expense-categories', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses', 'categories'] }),
  });
}

export type ExpenseInput = {
  title: string;
  amount: number;
  date: string;
  categoryId: string;
  paymentMethod: PaymentMethod;
  notes?: string;
};

export function useSaveExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: ExpenseInput & { id?: string }) =>
      id
        ? api<Expense>(`/finance/expenses/${id}`, { method: 'PATCH', body: input })
        : api<Expense>('/finance/expenses', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/finance/expenses/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });
}
