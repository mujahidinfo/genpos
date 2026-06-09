"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useFormatCurrency } from "@/lib/currency-context";
import { cn } from "@/lib/utils";
import { FinanceNav } from "@/components/finance/finance-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText, Printer, TrendingUp, TrendingDown, DollarSign, Users,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ReportType = "income_statement" | "expense" | "employee_salary";
type PaymentMethod = "CASH" | "CARD" | "MOBILE_MONEY" | "BANK_TRANSFER";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash", CARD: "Card", MOBILE_MONEY: "Mobile Money", BANK_TRANSFER: "Bank Transfer",
};

const REPORT_TYPE_CONFIG: Record<ReportType, { label: string; icon: React.ElementType; description: string }> = {
  income_statement: {
    label: "Income Statement",
    icon: DollarSign,
    description: "Revenue vs expenses with net profit/loss",
  },
  expense: {
    label: "Expense Report",
    icon: TrendingDown,
    description: "Detailed breakdown of all expenses",
  },
  employee_salary: {
    label: "Salary Report",
    icon: Users,
    description: "Employee salary costs for the period",
  },
};

// Quick date range presets
function getPreset(preset: string): { from: string; to: string } {
  const now = new Date();
  const pad = (d: Date) => d.toISOString().split("T")[0];

  switch (preset) {
    case "this_month": {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: pad(s), to: pad(e) };
    }
    case "last_month": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: pad(s), to: pad(e) };
    }
    case "this_quarter": {
      const q = Math.floor(now.getMonth() / 3);
      const s = new Date(now.getFullYear(), q * 3, 1);
      const e = new Date(now.getFullYear(), q * 3 + 3, 0);
      return { from: pad(s), to: pad(e) };
    }
    case "this_year": {
      return {
        from: `${now.getFullYear()}-01-01`,
        to: `${now.getFullYear()}-12-31`,
      };
    }
    default:
      return { from: pad(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)), to: pad(now) };
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ReportsView() {
  const formatCurrency = useFormatCurrency();

  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  const defaultTo = today.toISOString().split("T")[0];

  const [reportType, setReportType] = useState<ReportType>("income_statement");
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [filterCategory, setFilterCategory] = useState("");
  const [generated, setGenerated] = useState(false);

  const { data: categories } = trpc.finance.expenseCategories.list.useQuery();

  const { data, isLoading, refetch } = trpc.finance.report.useQuery(
    {
      from: new Date(fromDate),
      to: new Date(toDate),
      type: reportType,
      categoryId: filterCategory || undefined,
    },
    { enabled: generated },
  );

  function applyPreset(preset: string) {
    const { from, to } = getPreset(preset);
    setFromDate(from);
    setToDate(to);
    setGenerated(false);
  }

  function generate() {
    if (generated) {
      refetch();
    } else {
      setGenerated(true);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Finance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Generate financial reports</p>
        </div>
        {data && (
          <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
            <Printer className="h-4 w-4 mr-1.5" />
            Print
          </Button>
        )}
      </div>

      <FinanceNav />

      {/* Report Config */}
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configure Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Report type selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(Object.entries(REPORT_TYPE_CONFIG) as [ReportType, typeof REPORT_TYPE_CONFIG[ReportType]][]).map(
              ([type, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => { setReportType(type); setGenerated(false); }}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                      reportType === type
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300",
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      reportType === type ? "bg-indigo-100" : "bg-slate-100",
                    )}>
                      <Icon className={cn("h-4 w-4", reportType === type ? "text-indigo-600" : "text-slate-500")} />
                    </div>
                    <div>
                      <p className={cn("text-sm font-semibold", reportType === type ? "text-indigo-700" : "text-slate-700")}>
                        {cfg.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{cfg.description}</p>
                    </div>
                  </button>
                );
              }
            )}
          </div>

          {/* Date range */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>From</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setGenerated(false); }}
                className="h-9 w-40"
              />
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setGenerated(false); }}
                className="h-9 w-40"
              />
            </div>

            {/* Presets */}
            <div className="flex gap-1.5 flex-wrap">
              {[
                { label: "This Month", value: "this_month" },
                { label: "Last Month", value: "last_month" },
                { label: "This Quarter", value: "this_quarter" },
                { label: "This Year", value: "this_year" },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => applyPreset(p.value)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter (only for expense report) */}
          {reportType === "expense" && (
            <div className="space-y-1.5 max-w-xs">
              <Label>Category Filter (optional)</Label>
              <Select
                value={filterCategory || "all"}
                onValueChange={(v) => { setFilterCategory(v === "all" ? "" : v); setGenerated(false); }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={generate} disabled={isLoading}>
            <FileText className="h-4 w-4 mr-1.5" />
            {isLoading ? "Generating…" : "Generate Report"}
          </Button>
        </CardContent>
      </Card>

      {/* Report Output */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {data && !isLoading && (
        <div className="space-y-4 print:space-y-6">
          {/* Print header */}
          <div className="hidden print:block border-b pb-4 mb-6">
            <h1 className="text-2xl font-bold">{REPORT_TYPE_CONFIG[reportType].label}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Period: {new Date(fromDate).toLocaleDateString()} – {new Date(toDate).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500">
              Generated: {new Date().toLocaleString()}
            </p>
          </div>

          {data.type === "income_statement" && (
            <IncomeStatementReport data={data as IncomeStatementData} formatCurrency={formatCurrency} />
          )}
          {data.type === "expense" && (
            <ExpenseReport data={data as ExpenseData} formatCurrency={formatCurrency} />
          )}
          {data.type === "employee_salary" && (
            <SalaryReport data={data as SalaryData} formatCurrency={formatCurrency} />
          )}
        </div>
      )}

      {!data && !isLoading && generated && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <FileText className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No data for the selected period</p>
        </div>
      )}
    </div>
  );
}

// ─── Shared types ─────────────────────────────────────────────────────────────

type IncomeStatementData = {
  type: "income_statement";
  income: { grossRevenue: number; taxCollected: number; discountsGiven: number; orderCount: number };
  expenses: { rows: { category: string; color: string; amount: number }[]; total: number };
  netProfit: number;
};

type ExpenseData = {
  type: "expense";
  items: {
    id: string; title: string; amount: number; date: Date; notes: string | null;
    paymentMethod: string;
    category: { name: string; color: string };
    employee: { name: string } | null;
  }[];
  total: number;
};

type SalaryData = {
  type: "employee_salary";
  items: {
    id: string; name: string; position: string; salary: number;
    salaryType: string; monthlySalary: number; totalForPeriod: number; joinDate: Date;
  }[];
  totalSalary: number;
  months: number;
};

// ─── Income Statement Report ──────────────────────────────────────────────────

function IncomeStatementReport({
  data,
  formatCurrency,
}: {
  data: IncomeStatementData;
  formatCurrency: (v: number) => string;
}) {
  const netPositive = data.netProfit >= 0;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Gross Revenue</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(data.income.grossRevenue)}</p>
            <p className="text-xs text-slate-400 mt-1">{data.income.orderCount} orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(data.expenses.total)}</p>
            <p className="text-xs text-slate-400 mt-1">{data.expenses.rows.length} categories</p>
          </CardContent>
        </Card>
        <Card className={cn("border-2", netPositive ? "border-emerald-200" : "border-red-200")}>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Net {netPositive ? "Profit" : "Loss"}</p>
            <p className={cn("text-2xl font-bold mt-1", netPositive ? "text-emerald-600" : "text-red-600")}>
              {formatCurrency(Math.abs(data.netProfit))}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Margin: {data.income.grossRevenue > 0
                ? ((data.netProfit / data.income.grossRevenue) * 100).toFixed(1)
                : "0"}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Revenue
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Gross Revenue</TableCell>
                <TableCell className="text-right font-semibold text-emerald-600">{formatCurrency(data.income.grossRevenue)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-slate-500">Tax Collected</TableCell>
                <TableCell className="text-right text-slate-600">{formatCurrency(data.income.taxCollected)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-slate-500">Discounts Given</TableCell>
                <TableCell className="text-right text-slate-600">({formatCurrency(data.income.discountsGiven)})</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expense breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            Expenses by Category
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">% of Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.expenses.rows.map((row) => (
                <TableRow key={row.category}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: row.color }} />
                      {row.category}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(row.amount)}</TableCell>
                  <TableCell className="text-right text-slate-500">
                    {data.income.grossRevenue > 0
                      ? ((row.amount / data.income.grossRevenue) * 100).toFixed(1)
                      : "0"}%
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold bg-slate-50">
                <TableCell>Total Expenses</TableCell>
                <TableCell className="text-right text-red-600">{formatCurrency(data.expenses.total)}</TableCell>
                <TableCell className="text-right text-slate-600">
                  {data.income.grossRevenue > 0
                    ? ((data.expenses.total / data.income.grossRevenue) * 100).toFixed(1)
                    : "0"}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Expense Report ───────────────────────────────────────────────────────────

function ExpenseReport({
  data,
  formatCurrency,
}: {
  data: ExpenseData;
  formatCurrency: (v: number) => string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{data.items.length} expense(s) found</p>
        <div className="text-right">
          <p className="text-xs text-slate-400">Total</p>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(data.total)}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Payment</TableHead>
                <TableHead className="hidden md:table-cell">Employee</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    <p className="font-medium text-sm text-slate-800">{expense.title}</p>
                    {expense.notes && <p className="text-xs text-slate-400">{expense.notes}</p>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: expense.category.color }} />
                      <span className="text-sm text-slate-600">{expense.category.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-slate-500">
                    {new Date(expense.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-slate-500">
                    {PAYMENT_LABELS[expense.paymentMethod as PaymentMethod]}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-slate-500">
                    {expense.employee?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-slate-900">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-slate-50 font-semibold">
                <TableCell colSpan={5}>Total</TableCell>
                <TableCell className="text-right text-slate-900">{formatCurrency(data.total)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Salary Report ────────────────────────────────────────────────────────────

const SALARY_LABELS: Record<string, string> = {
  MONTHLY: "mo", HOURLY: "hr", WEEKLY: "wk", ANNUALLY: "yr",
};

function SalaryReport({
  data,
  formatCurrency,
}: {
  data: SalaryData;
  formatCurrency: (v: number) => string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {data.items.length} active employee(s) · {data.months} month(s) period
        </p>
        <div className="text-right">
          <p className="text-xs text-slate-400">Total Payroll</p>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(data.totalSalary)}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead>Employee</TableHead>
                <TableHead>Position</TableHead>
                <TableHead className="hidden md:table-cell">Rate</TableHead>
                <TableHead className="hidden md:table-cell">Monthly Est.</TableHead>
                <TableHead className="text-right">Period Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-slate-800">{row.name}</TableCell>
                  <TableCell className="text-sm text-slate-500">{row.position}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-slate-500">
                    {formatCurrency(row.salary)}/{SALARY_LABELS[row.salaryType] ?? "mo"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-slate-700">
                    {formatCurrency(row.monthlySalary)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-slate-900">
                    {formatCurrency(row.totalForPeriod)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-slate-50 font-semibold">
                <TableCell colSpan={4}>Total Payroll</TableCell>
                <TableCell className="text-right text-slate-900">{formatCurrency(data.totalSalary)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
