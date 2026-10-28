import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  AnalyticsOverview,
  Category,
  Customer,
  Expense,
  ExpenseCategory,
  ExpenseSource,
  FinanceOverview,
  Order,
  OrderStatus,
  Paginated,
  Payroll,
  PaymentMethod,
  Product,
  RecurringBill,
  RecurringFrequency,
  Role,
  SalaryType,
  ProductDetail,
  ReorderSuggestion,
  ScannedProduct,
  Member,
  Purchase,
  ShopSummary,
  Supplier,
  SupplierDetail,
  SalesChartPoint,
  Shop,
  TopProduct,
  Upcoming,
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

export function useProducts(search: string, categoryId?: string) {
  return useInfiniteQuery({
    queryKey: ['products', 'list', search, categoryId ?? null],
    queryFn: ({ pageParam }) =>
      api<Paginated<Product>>('/products', {
        query: { search, categoryId, page: pageParam, pageSize: PAGE_SIZE },
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
  imageUrl?: string;
};

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api<Category[]>('/categories'),
    staleTime: 5 * 60_000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string }) =>
      api<Category>('/categories', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

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
  /** Counter sales are always completed. */
  status?: 'FULFILLED';
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
  /** Monthly pay — adds them to payroll. */
  salary?: number;
  payDay?: number;
};

export function useAddMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MemberInput) => api<Member>('/members', { method: 'POST', body: input }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['members'] }),
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
      ]),
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      role?: Role;
      isActive?: boolean;
      shopId?: string | null;
      /** null or 0 takes them off payroll. */
      salary?: number | null;
      payDay?: number;
    }) => api<Member>(`/members/${id}`, { method: 'PATCH', body: input }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['members'] }),
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
      ]),
  });
}

// ─── Suppliers & purchases ───────────────────────────────────────────────────

export function useSuppliers(enabled = true) {
  return useQuery({
    queryKey: ['suppliers', 'list'],
    queryFn: () => api<Supplier[]>('/suppliers'),
    enabled,
  });
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
    // A supplier payment is also an expense.
    onSuccess: () =>
      Promise.all(
        [['suppliers'], ['expenses']].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });
}

export type PurchaseInput = {
  supplierId?: string;
  items: { productId: string; variantId: string; quantity: number; unitCost: number }[];
  paidAmount: number;
  paymentMethod: PaymentMethod;
  /** Keep each product's cost price in step with this delivery (server default: on). */
  updateCostPrice?: boolean;
  note?: string;
};

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PurchaseInput) => api<Purchase>('/purchases', { method: 'POST', body: input }),
    onSuccess: () =>
      Promise.all(
        [['products'], ['suppliers'], ['analytics'], ['expenses']].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });
}

// ─── Money out: expenses, payroll, recurring bills (owner/manager) ───────────
//
// Every query lives under the 'expenses' key, so recording any payment
// (expense, salary, bill, supplier) refreshes the whole money picture at once.

export type ExpenseFilters = { categoryId?: string; source?: ExpenseSource; days?: number };

export function useExpenses(filters: ExpenseFilters = {}) {
  const { days, ...rest } = filters;
  return useInfiniteQuery({
    queryKey: ['expenses', 'list', filters],
    queryFn: ({ pageParam }) => {
      // Whole days ending today, worked out per request so a screen left open overnight stays right.
      const from = days ? new Date(Date.now() - (days - 1) * 86_400_000) : undefined;
      from?.setHours(0, 0, 0, 0);
      return api<Paginated<Expense> & { totalAmount: number }>('/finance/expenses', {
        query: { ...rest, from: from?.toISOString(), page: pageParam, pageSize: PAGE_SIZE },
      });
    },
    initialPageParam: 1,
    getNextPageParam: nextPage,
  });
}

/** One expense by id — straight from the API so it works from any list or link. */
export function useExpense(id: string | undefined) {
  return useQuery({
    queryKey: ['expenses', 'detail', id],
    queryFn: async () => {
      // No single-item endpoint: the filtered list is cheap and cached.
      const res = await api<Paginated<Expense>>('/finance/expenses', { query: { pageSize: 100 } });
      return res.items.find((e) => e.id === id) ?? null;
    },
    enabled: !!id,
  });
}

export function useFinanceOverview(days: number) {
  return useQuery({
    queryKey: ['expenses', 'overview', days],
    queryFn: () => api<FinanceOverview>('/finance/overview', { query: { days } }),
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

/** Bills and salaries that are overdue or due within `days`. */
export function useUpcoming(days = 7, enabled = true) {
  return useQuery({
    queryKey: ['expenses', 'upcoming', days],
    queryFn: () => api<Upcoming>('/finance/upcoming', { query: { days } }),
    enabled,
  });
}

/** Salaries for a month ('2026-10'); omit for this month. */
export function usePayroll(month?: string, enabled = true) {
  return useQuery({
    queryKey: ['expenses', 'payroll', month ?? 'current'],
    queryFn: () => api<Payroll>('/finance/payroll', { query: { month } }),
    enabled,
  });
}

export function usePaySalary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      employeeId,
      ...input
    }: {
      employeeId: string;
      amount?: number;
      paymentMethod: PaymentMethod;
      month?: string;
      note?: string;
    }) => api<Expense>(`/finance/employees/${employeeId}/pay`, { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

export type EmployeeInput = {
  name: string;
  position: string;
  phone?: string;
  salary: number;
  salaryType: SalaryType;
  payDay: number;
  joinDate: string;
  isActive?: boolean;
};

/** Staff on payroll who don't sign in to the app. */
export function useSaveEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<EmployeeInput> & { id?: string }) =>
      id
        ? api(`/finance/employees/${id}`, { method: 'PATCH', body: input })
        : api('/finance/employees', { method: 'POST', body: input }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['members'] }),
      ]),
  });
}

export function useRecurringBills() {
  return useQuery({
    queryKey: ['expenses', 'recurring'],
    queryFn: () => api<RecurringBill[]>('/finance/recurring'),
  });
}

export type RecurringInput = {
  title: string;
  amount: number;
  categoryId: string;
  paymentMethod: PaymentMethod;
  frequency: RecurringFrequency;
  nextDueDate: string;
  notes?: string;
  isActive?: boolean;
};

export function useSaveRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<RecurringInput> & { id?: string }) =>
      id
        ? api<RecurringBill>(`/finance/recurring/${id}`, { method: 'PATCH', body: input })
        : api<RecurringBill>('/finance/recurring', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

export function useDeleteRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/finance/recurring/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

export function usePayRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; amount?: number; paymentMethod?: PaymentMethod }) =>
      api<Expense>(`/finance/recurring/${id}/pay`, { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

export function useReorderSuggestions(enabled: boolean, supplierId?: string) {
  return useQuery({
    queryKey: ['products', 'reorder', supplierId ?? null],
    queryFn: () => api<ReorderSuggestion[]>('/purchases/reorder', { query: { supplierId } }),
    enabled,
  });
}

// ─── Shop settings & account ─────────────────────────────────────────────────

/** Fields of PUT /shop (all optional). Applies to the active branch, plus business-wide currency/language. */
export type ShopSettingsInput = {
  name?: string;
  businessName?: string;
  phone?: string;
  address?: string;
  email?: string;
  currency?: string;
  language?: 'en' | 'bn';
  taxRate?: number;
  taxName?: string;
  allowNegativeStock?: boolean;
};

export function useUpdateShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ShopSettingsInput) => api<Shop>('/shop', { method: 'PUT', body: input }),
    // Prices on screen depend on currency, language and tax.
    onSuccess: (shop) => queryClient.setQueryData(['shop'], shop),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword?: string; newPassword: string }) =>
      api<{ success: boolean }>('/auth/password', { method: 'PATCH', body: input }),
  });
}
