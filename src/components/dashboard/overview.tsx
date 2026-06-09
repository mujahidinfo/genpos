"use client";
import { trpc } from "@/lib/trpc/client";
import { useFormatCurrency } from "@/lib/currency-context";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  Plus,
  Receipt,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { AuthUser } from "@/lib/auth";
import Link from "next/link";

const CATEGORY_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getTodayLabel() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow duration-200">
      <div className={`${iconBg} rounded-xl p-3 shrink-0`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-0.5 leading-tight tabular-nums break-words">
          {value}
        </p>
        {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  const formatCurrency = useFormatCurrency();
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-3 py-2.5">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-900">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export function DashboardOverview({ user }: { user: AuthUser }) {
  const formatCurrency = useFormatCurrency();
  const { data: overview, isLoading: overviewLoading } = trpc.analytics.overview.useQuery();
  const { data: salesChart } = trpc.analytics.salesChart.useQuery();
  const { data: topProducts } = trpc.analytics.topProducts.useQuery();
  const { data: revenueByCategory } = trpc.analytics.revenueByCategory.useQuery();

  const chartData = (salesChart ?? []).slice(-14);
  const maxRevenue = Math.max(...(topProducts ?? []).map((p) => p.totalRevenue), 1);
  const firstName = user.name.split(" ")[0];
  console.log("Formate C  urrency", formatCurrency(200));

  const stats = [
    {
      label: "Revenue",
      value: formatCurrency(overview?.totalRevenue ?? 0),
      sub: `Last 30 days · ${overview?.fulfilledOrders ?? 0} fulfilled`,
      icon: DollarSign,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      label: "Orders",
      value: String(overview?.totalOrders ?? 0),
      sub: "Last 30 days",
      icon: ShoppingCart,
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-50",
    },
    {
      label: "Products",
      value: String(overview?.totalProducts ?? 0),
      sub: overview?.lowStockCount
        ? `${overview.lowStockCount} running low`
        : "All stocked",
      icon: Package,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      label: "Customers",
      value: String(overview?.totalCustomers ?? 0),
      sub: "Total registered",
      icon: Users,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6 w-full">

      {/* Greeting + CTA */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">{getTodayLabel()}</p>
        </div>
        <Link
          href="/sales"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors duration-150 shrink-0 shadow-sm shadow-indigo-200"
        >
          <Plus className="h-4 w-4" />
          New Sale
        </Link>
      </div>

      {/* Low stock banner */}
      {!overviewLoading && (overview?.lowStockCount ?? 0) > 0 && (
        <Link
          href="/inventory"
          className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{overview!.lowStockCount} product variant{overview!.lowStockCount > 1 ? "s are" : " is"} running low</span>
              {" "}— restock soon to avoid lost sales.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-amber-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">

        {/* Revenue area chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Revenue Trend</h2>
              <p className="text-xs text-slate-400 mt-0.5">Last 14 days</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" />
              Revenue
            </span>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                }
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                fill="url(#revGrad)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category donut */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900">By Category</h2>
            <p className="text-xs text-slate-400 mt-0.5">Revenue split</p>
          </div>
          {(revenueByCategory ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[210px] text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                <Package className="h-5 w-5 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-400">No data yet</p>
              <p className="text-xs text-slate-300 mt-1">Sales will appear here</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={revenueByCategory ?? []}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%"
                  cy="42%"
                  innerRadius={52}
                  outerRadius={76}
                  strokeWidth={0}
                  paddingAngle={2}
                >
                  {(revenueByCategory ?? []).map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  iconSize={7}
                  iconType="circle"
                  formatter={(val) => (
                    <span style={{ fontSize: 11, color: "#64748b" }}>{val}</span>
                  )}
                />
                <Tooltip
                  formatter={(v) => formatCurrency(v as number)}
                  contentStyle={{
                    border: "1px solid #f1f5f9",
                    borderRadius: 12,
                    fontSize: 12,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                    padding: "8px 12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top products */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Top Products</h2>
            <p className="text-xs text-slate-400 mt-0.5">Best sellers this month</p>
          </div>
          <Link
            href="/analytics"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
          >
            View all
            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {(topProducts ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
              <Receipt className="h-5 w-5 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-400">No sales yet</p>
            <Link
              href="/sales"
              className="text-xs text-indigo-600 font-semibold mt-2 hover:underline inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Make your first sale
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {(topProducts ?? []).slice(0, 5).map((p, i) => {
              const pct = Math.round((p.totalRevenue / maxRevenue) * 100);
              const rankColors = ["text-amber-400", "text-slate-400", "text-amber-700"];
              return (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-4 text-center shrink-0 ${rankColors[i] ?? "text-slate-300"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                      <span className="text-sm font-semibold text-slate-900 tabular-nums shrink-0">
                        {formatCurrency(p.totalRevenue)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 shrink-0 w-14 text-right">
                        {p.totalQty} units
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
