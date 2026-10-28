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
  /** Payroll entry — present when the person has a monthly salary. */
  employee: { id: string; salary: number; salaryType: SalaryType; payDay: number; isActive: boolean } | null;
};

export type SalaryType = 'MONTHLY' | 'HOURLY' | 'WEEKLY' | 'ANNUALLY';

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

/** How an expense got into the ledger. */
export type ExpenseSource = 'MANUAL' | 'SALARY' | 'SUPPLIER_PAYMENT' | 'RECURRING';

export type Expense = {
  id: string;
  title: string;
  amount: number;
  date: string;
  categoryId: string;
  paymentMethod: PaymentMethod;
  status: ExpenseStatus;
  notes: string | null;
  source: ExpenseSource;
  category: ExpenseCategory;
  employee?: { id: string; name: string; position: string } | null;
};

/** GET /finance/overview — money in and out for the last N days. */
export type FinanceOverview = {
  totalExpenses: number;
  expenseCount: number;
  totalIncome: number;
  orderCount: number;
  netProfit: number;
  expensesByCategory: { categoryId: string; name: string; color: string; amount: number }[];
  expensesBySource: { source: ExpenseSource; amount: number }[];
};

export type PayrollState = 'PAID' | 'DUE' | 'UPCOMING';

export type PayrollItem = {
  employeeId: string;
  /** Set when the person also signs in to the app. */
  membershipId: string | null;
  name: string;
  position: string;
  phone: string | null;
  salary: number;
  salaryType: SalaryType;
  payDay: number;
  /** What this month's pay is (monthly equivalent of the salary). */
  amount: number;
  dueDate: string;
  state: PayrollState;
  paidAmount: number | null;
  paidOn: string | null;
  expenseId: string | null;
};

export type Payroll = {
  month: string;
  label: string;
  items: PayrollItem[];
  totals: { total: number; paid: number; outstanding: number; dueCount: number };
};

export type RecurringFrequency = 'WEEKLY' | 'MONTHLY';

export type RecurringBill = {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  paymentMethod: PaymentMethod;
  frequency: RecurringFrequency;
  nextDueDate: string;
  isActive: boolean;
  notes: string | null;
  category: ExpenseCategory;
  /** Negative = overdue. */
  daysUntil: number;
};

/** Something to pay soon: a recurring bill or a salary. */
export type UpcomingItem = {
  kind: 'BILL' | 'SALARY';
  /** Bill id, or employee id for a salary. */
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  dueDate: string;
  daysUntil: number;
};

export type Upcoming = { items: UpcomingItem[]; total: number; overdueCount: number };

/** GET /purchases/reorder — a low-stock item and where it was last bought. */
export type ReorderSuggestion = {
  productId: string;
  variantId: string;
  name: string;
  stock: number;
  lowStock: number;
  suggestedQuantity: number;
  unitCost: number;
  supplier: { id: string; name: string } | null;
};
