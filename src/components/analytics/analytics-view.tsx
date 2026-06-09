"use client";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFormatCurrency } from "@/lib/currency-context";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];
const PERIODS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

export function AnalyticsView() {
  const formatCurrency = useFormatCurrency();
  const [days, setDays] = useState(30);

  const { data: overview } = trpc.analytics.overview.useQuery({ days });
  const { data: salesChart } = trpc.analytics.salesChart.useQuery({ days });
  const { data: topProducts } = trpc.analytics.topProducts.useQuery({
    days,
    limit: 10,
  });
  const { data: revenueByCategory } = trpc.analytics.revenueByCategory.useQuery(
    { days },
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Sales trends and performance insights
          </p>
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${days === p.value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Revenue",
            value: formatCurrency(overview?.totalRevenue ?? 0),
          },
          {
            label: "Fulfilled Orders",
            value: String(overview?.fulfilledOrders ?? 0),
          },
          { label: "Total Orders", value: String(overview?.totalOrders ?? 0) },
          { label: "Customers", value: String(overview?.totalCustomers ?? 0) },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trend</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesChart ?? []}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip formatter={(v) => formatCurrency(v as number)} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    fill="url(#revGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts ?? []} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={120}
                  />
                  <Tooltip formatter={(v) => formatCurrency(v as number)} />
                  <Bar
                    dataKey="totalRevenue"
                    fill="#6366f1"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByCategory ?? []}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name ?? ""} ${(((percent as number | undefined) ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {(revenueByCategory ?? []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v) => formatCurrency(v as number)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
