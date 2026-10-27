/**
 * Response shapes of apps/api, as they arrive over JSON (dates are ISO strings).
 * Only the fields the mobile app reads are listed.
 */

export type Role = 'ADMIN' | 'CASHIER' | 'INVENTORY_MANAGER';
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'FULFILLED' | 'CANCELED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER';
export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AuthResponse = {
  tokenType: 'Bearer';
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: AuthUser;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type Shop = {
  id: string;
  name: string;
  currency: string;
  language: string;
  taxRate: number;
  taxName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
};

export type Category = {
  id: string;
  name: string;
  color: string | null;
};

export type ProductVariant = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: number | null;
  stock: number;
  lowStock: number;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  price: number;
  costPrice: number;
  imageUrl: string | null;
  isActive: boolean;
  category: Category | null;
  variants: ProductVariant[];
};

export type StockMovement = {
  id: string;
  variantId: string | null;
  type: StockMovementType;
  quantity: number;
  note: string | null;
  createdAt: string;
};

export type ProductDetail = Product & { stockMovements: StockMovement[] };

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export type OrderItem = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  quantity: number;
  total: number;
  variant?: { id: string; name: string } | null;
};

export type Refund = {
  id: string;
  amount: number;
  reason: string | null;
  createdAt: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  type: 'WALK_IN' | 'ONLINE';
  subtotal: number;
  discountAmt: number;
  taxRate: number;
  taxAmt: number;
  total: number;
  paymentMethod: PaymentMethod;
  note: string | null;
  createdAt: string;
  customer: Customer | null;
  cashier: { id: string; name: string } | null;
  items: OrderItem[];
  refunds: Refund[];
};

export type AnalyticsOverview = {
  totalRevenue: number;
  fulfilledOrders: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockCount: number;
};

export type SalesChartPoint = { date: string; revenue: number };

export type TopProduct = {
  productId: string;
  name: string;
  totalQty: number;
  totalRevenue: number;
};
