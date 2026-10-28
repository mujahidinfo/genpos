/**
 * Response shapes of apps/api, as they arrive over JSON (dates are ISO strings).
 * Only the fields the mobile app reads are listed.
 */

export type Role = 'OWNER' | 'MANAGER' | 'CASHIER' | 'INVENTORY_MANAGER';
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'FULFILLED' | 'CANCELED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER';
export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

/** A branch the user can open. */
export type ShopSummary = {
  id: string;
  name: string;
  address: string | null;
};

/** A business the user belongs to (GET /businesses). */
export type Workspace = {
  id: string;
  name: string;
  currency: string;
  language: string;
  role: Role;
  shops: ShopSummary[];
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

/** The active branch with business-wide settings (GET /shop). */
export type Shop = {
  id: string;
  businessId: string;
  businessName: string;
  name: string;
  currency: string;
  language: string;
  role: Role;
  taxRate: number;
  taxName: string;
  allowNegativeStock: boolean;
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
  /** Hidden variant of a simple (single) product. */
  isDefault: boolean;
  /** Stock in the active branch. */
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

/** GET /products/barcode/:code — which variant the scanned code points at. */
export type ScannedProduct = Product & { matchedVariantId: string | null };

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
  amountTendered: number | null;
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

// ─── Staff ───────────────────────────────────────────────────────────────────

export type Member = {
  id: string;
  role: Role;
  isActive: boolean;
  /** null = all branches. */
  shopId: string | null;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  shop: { id: string; name: string } | null;
};

// ─── Suppliers & purchases ───────────────────────────────────────────────────

export type SupplierBalance = {
  totalPurchased: number;
  totalPaid: number;
  /** What the shop still owes this supplier. */
  due: number;
};

export type Supplier = SupplierBalance & {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
};

export type SupplierPayment = {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  note: string | null;
  purchaseId: string | null;
  createdAt: string;
};

export type SupplierDetail = Supplier & {
  purchases: {
    id: string;
    purchaseNumber: string;
    total: number;
    createdAt: string;
    shop: { id: string; name: string };
  }[];
  payments: SupplierPayment[];
};

export type Purchase = {
  id: string;
  purchaseNumber: string;
  total: number;
  note: string | null;
  createdAt: string;
  supplier: { id: string; name: string } | null;
  receivedBy: { id: string; name: string };
  items: { id: string; name: string; quantity: number; unitCost: number; total: number }[];
  payments: SupplierPayment[];
};

// ─── Expenses ────────────────────────────────────────────────────────────────

export type ExpenseStatus = 'PAID' | 'PENDING' | 'CANCELLED';

export type ExpenseCategory = {
  id: string;
  name: string;
  color: string;
  _count?: { expenses: number };
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  date: string;
  categoryId: string;
  paymentMethod: PaymentMethod;
  status: ExpenseStatus;
  notes: string | null;
  category: ExpenseCategory;
};
