import type { MemberRole, Prisma, ProductVariant, StockMovement } from "@genpos/db";

/**
 * Shapes returned by apps/api. The API serializes Prisma objects, and
 * `apiFetch` revives ISO date strings, so Prisma payload types describe them.
 */

export type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number };

// ─── Workspace ───────────────────────────────────────────────────────────────

export type ShopSummary = { id: string; name: string; address: string | null };

export type Workspace = {
  id: string;
  name: string;
  currency: string;
  language: string;
  role: MemberRole;
  shops: ShopSummary[];
};

/** GET /shop — the active branch flattened with business-wide settings. */
export type CurrentShop = Prisma.ShopGetPayload<object> & {
  businessName: string;
  currency: string;
  language: string;
  role: MemberRole;
};

export type Member = Prisma.MembershipGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true; avatarUrl: true } };
    shop: { select: { id: true; name: true } };
  };
}>;

// ─── Catalog ─────────────────────────────────────────────────────────────────

/** A variant with the active branch's stock flattened onto it. */
export type VariantWithStock = ProductVariant & { stock: number; lowStock: number };

export type Product = Prisma.ProductGetPayload<{ include: { category: true } }> & {
  variants: VariantWithStock[];
};

export type ProductDetail = Product & { stockMovements: StockMovement[] };

export type ScannedProduct = Product & { matchedVariantId: string | null };

export type CategoryWithCount = Prisma.CategoryGetPayload<{
  include: { _count: { select: { products: true } } };
}>;

// ─── Customers & orders ──────────────────────────────────────────────────────

export type CustomerWithCount = Prisma.CustomerGetPayload<{
  include: { _count: { select: { orders: true } } };
}>;

export type CustomerDetail = Prisma.CustomerGetPayload<{
  include: { orders: { include: { items: true } } };
}>;

export type OrderListItem = Prisma.OrderGetPayload<{
  include: {
    customer: true;
    cashier: { select: { id: true; name: true } };
    items: { include: { product: true } };
    refunds: true;
  };
}>;

export type OrderDetail = Prisma.OrderGetPayload<{
  include: {
    customer: true;
    cashier: { select: { id: true; name: true } };
    items: { include: { product: true; variant: true } };
    refunds: true;
  };
}>;

// ─── Analytics ───────────────────────────────────────────────────────────────

export type AnalyticsOverview = {
  totalRevenue: number;
  fulfilledOrders: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockCount: number;
};

export type SalesChartPoint = { date: string; revenue: number };
export type TopProduct = { productId: string; name: string; totalQty: number; totalRevenue: number };
export type CategoryRevenue = { name: string; revenue: number };

// ─── Finance ─────────────────────────────────────────────────────────────────

export type ExpenseCategoryWithCount = Prisma.ExpenseCategoryGetPayload<{
  include: { _count: { select: { expenses: true } } };
}>;

export type ExpenseListItem = Prisma.ExpenseGetPayload<{
  include: {
    category: true;
    employee: { select: { id: true; name: true; position: true } };
  };
}>;

export type ExpenseWithRelations = Prisma.ExpenseGetPayload<{
  include: { category: true; employee: true };
}>;

export type EmployeeWithCount = Prisma.EmployeeGetPayload<{
  include: { _count: { select: { expenses: true } } };
}>;

export type BudgetWithSpend = Prisma.BudgetGetPayload<{ include: { category: true } }> & {
  spent: number;
  percentage: number;
};

export type FinanceOverview = {
  totalExpenses: number;
  expenseCount: number;
  totalIncome: number;
  orderCount: number;
  netProfit: number;
  employeeCount: number;
  budgetCount: number;
  recentExpenses: Prisma.ExpenseGetPayload<{ include: { category: true } }>[];
  expensesByCategory: { categoryId: string; name: string; color: string; amount: number }[];
  monthlyTrend: { month: string; income: number; expenses: number }[];
};

export type FinanceReport =
  | {
      type: "income_statement";
      income: { grossRevenue: number; taxCollected: number; discountsGiven: number; orderCount: number };
      expenses: { rows: { category: string; color: string; amount: number }[]; total: number };
      netProfit: number;
    }
  | {
      type: "expense";
      items: Prisma.ExpenseGetPayload<{
        include: { category: true; employee: { select: { id: true; name: true } } };
      }>[];
      total: number;
    }
  | {
      type: "employee_salary";
      items: {
        id: string;
        name: string;
        position: string;
        salary: number;
        salaryType: "MONTHLY" | "HOURLY" | "WEEKLY" | "ANNUALLY";
        monthlySalary: number;
        totalForPeriod: number;
        joinDate: Date;
      }[];
      totalSalary: number;
      months: number;
    };
