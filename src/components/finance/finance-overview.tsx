"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useFormatCurrency } from "@/lib/currency-context";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceNav } from "./finance-nav";
import {
  TrendingUp, TrendingDown, Wallet, Users, Target,
  ArrowUpRight, ArrowDownRight, Receipt,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";

const PERIODS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
] as const;

const PIE_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#ec4899",
];

export function FinanceOverview() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const formatCurrency = useFormatCurrency();

  const { data, isLoading } = trpc.finance.overview.useQuery({ days });

  const netPositive = (data?.netProfit ?? 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Finance</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track income, expenses, and financial health
          </p>
        </div>
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDays(p.value as 7 | 30 | 90)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                days === p.value
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <FinanceNav />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Income"
          value={formatCurrency(data?.totalIncome ?? 0)}
          sub={`${data?.orderCount ?? 0} orders`}
          icon={TrendingUp}
          color="emerald"
          loading={isLoading}
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(data?.totalExpenses ?? 0)}
          sub={`${data?.expenseCount ?? 0} entries`}
          icon={TrendingDown}
          color="red"
          loading={isLoading}
        />
        <StatCard
          label="Net Profit / Loss"
          value={formatCurrency(Math.abs(data?.netProfit ?? 0))}
          sub={netPositive ? "Profitable" : "Loss"}
          icon={netPositive ? ArrowUpRight : ArrowDownRight}
          color={netPositive ? "indigo" : "amber"}
          loading={isLoading}
        />
        <StatCard
          label="Active Employees"
          value={String(data?.employeeCount ?? 0)}
          sub={`${data?.budgetCount ?? 0} budgets`}
          icon={Users}
          color="slate"
          loading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Income vs Expenses (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart
                data={data?.monthlyTrend ?? []}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCurrency(v)}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(val) => formatCurrency(Number(val))}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(v) => (v === "income" ? "Income" : "Expenses")}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#incomeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#expenseGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expenses by Category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.expensesByCategory?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <Receipt className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No expense data</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={data?.expensesByCategory}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                    >
                      {data?.expensesByCategory?.map((entry, i) => (
                        <Cell
                          key={entry.categoryId}
                          fill={entry.color || PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(val) => formatCurrency(Number(val))}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {data?.expensesByCategory?.slice(0, 5).map((cat, i) => (
                    <div key={cat.categoryId} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: cat.color || PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="text-slate-600 truncate max-w-[100px]">{cat.name}</span>
                      </div>
                      <span className="font-medium text-slate-800">{formatCurrency(cat.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(data?.recentExpenses?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Wallet className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No expenses recorded yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data?.recentExpenses?.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between px-6 py-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: expense.category.color }}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{expense.title}</p>
                      <p className="text-xs text-slate-400">{expense.category.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(expense.amount)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

type Color = "emerald" | "red" | "indigo" | "amber" | "slate";

const COLOR_MAP: Record<Color, { bg: string; icon: string; text: string }> = {
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", text: "text-emerald-700" },
  red:     { bg: "bg-red-50",     icon: "text-red-600",     text: "text-red-700"     },
  indigo:  { bg: "bg-indigo-50",  icon: "text-indigo-600",  text: "text-indigo-700"  },
  amber:   { bg: "bg-amber-50",   icon: "text-amber-600",   text: "text-amber-700"   },
  slate:   { bg: "bg-slate-100",  icon: "text-slate-600",   text: "text-slate-700"   },
};

function StatCard({
  label, value, sub, icon: Icon, color, loading,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  color: Color;
  loading?: boolean;
}) {
  const c = COLOR_MAP[color];
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
              {label}
            </p>
            {loading ? (
              <div className="h-7 w-24 bg-slate-100 rounded animate-pulse mt-1" />
            ) : (
              <p className="text-2xl font-bold text-slate-900 mt-1 leading-none">{value}</p>
            )}
            <p className={cn("text-xs font-medium mt-1", c.text)}>{sub}</p>
          </div>
          <div className={cn("p-2.5 rounded-xl shrink-0", c.bg)}>
            <Icon className={cn("h-5 w-5", c.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
