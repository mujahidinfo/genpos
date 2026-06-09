"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { trpc } from "@/lib/trpc/client";
import { useFormatCurrency } from "@/lib/currency-context";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { FinanceNav } from "@/components/finance/finance-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Target, TrendingDown, CheckCircle2, AlertTriangle } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type BudgetPeriod = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

interface BudgetForm {
  name: string;
  amount: number;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  categoryId: string;
}

const PERIOD_LABELS: Record<BudgetPeriod, string> = {
  WEEKLY: "Weekly", MONTHLY: "Monthly", QUARTERLY: "Quarterly", YEARLY: "Yearly",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function BudgetView() {
  const { toast } = useToast();
  const formatCurrency = useFormatCurrency();
  const utils = trpc.useUtils();

  const [dialog, setDialog] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: budgets, isLoading } = trpc.finance.budget.list.useQuery();
  const { data: categories } = trpc.finance.expenseCategories.list.useQuery();

  const createMutation = trpc.finance.budget.create.useMutation({
    onSuccess: () => {
      utils.finance.budget.list.invalidate();
      setDialog(null);
      toast({ title: "Budget created" });
    },
    onError: (e) => toast({ title: e.message, variant: "destructive" }),
  });

  const updateMutation = trpc.finance.budget.update.useMutation({
    onSuccess: () => {
      utils.finance.budget.list.invalidate();
      setDialog(null);
      toast({ title: "Budget updated" });
    },
    onError: (e) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteMutation = trpc.finance.budget.delete.useMutation({
    onSuccess: () => {
      utils.finance.budget.list.invalidate();
      setDeleteConfirm(null);
      toast({ title: "Budget deleted" });
    },
    onError: (e) => toast({ title: e.message, variant: "destructive" }),
  });

  const form = useForm<BudgetForm>({
    defaultValues: {
      name: "", amount: 0, period: "MONTHLY",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "", categoryId: "",
    },
  });

  function openAdd() {
    form.reset({
      name: "", amount: 0, period: "MONTHLY",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "", categoryId: "",
    });
    setEditingId(null);
    setDialog("add");
  }

  function openEdit(b: NonNullable<typeof budgets>[number]) {
    form.reset({
      name: b.name,
      amount: b.amount,
      period: b.period as BudgetPeriod,
      startDate: new Date(b.startDate).toISOString().split("T")[0],
      endDate: b.endDate ? new Date(b.endDate).toISOString().split("T")[0] : "",
      categoryId: b.categoryId ?? "",
    });
    setEditingId(b.id);
    setDialog("edit");
  }

  function onSubmit(values: BudgetForm) {
    const payload = {
      name: values.name,
      amount: Number(values.amount),
      period: values.period,
      startDate: new Date(values.startDate),
      endDate: values.endDate ? new Date(values.endDate) : undefined,
      categoryId: values.categoryId || undefined,
    };
    if (dialog === "edit" && editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  // Summary stats
  const totalBudgeted = budgets?.reduce((s, b) => s + b.amount, 0) ?? 0;
  const totalSpent = budgets?.reduce((s, b) => s + b.spent, 0) ?? 0;
  const overBudgetCount = budgets?.filter((b) => b.percentage >= 100).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Finance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Budget planning and tracking</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Budget
        </Button>
      </div>

      <FinanceNav />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Budgeted</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(totalBudgeted)}</p>
              </div>
              <div className="p-2 rounded-xl bg-indigo-50">
                <Target className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Spent</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="p-2 rounded-xl bg-red-50">
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Over Budget</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{overBudgetCount}</p>
                <p className="text-xs text-slate-400 mt-0.5">of {budgets?.length ?? 0} budgets</p>
              </div>
              <div className={cn("p-2 rounded-xl", overBudgetCount > 0 ? "bg-red-50" : "bg-emerald-50")}>
                {overBudgetCount > 0
                  ? <AlertTriangle className="h-4 w-4 text-red-500" />
                  : <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Cards */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (budgets?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Target className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No budgets set</p>
          <p className="text-xs mt-1">Create budgets to track spending limits</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets?.map((budget) => {
            const pct = budget.percentage;
            const remaining = budget.amount - budget.spent;
            const isOver = pct >= 100;
            const isWarning = pct >= 80 && pct < 100;

            return (
              <Card key={budget.id} className={cn(
                "transition-shadow hover:shadow-md",
                isOver && "border-red-200",
              )}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{budget.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-slate-400">
                          {PERIOD_LABELS[budget.period as BudgetPeriod]}
                        </span>
                        {budget.category && (
                          <>
                            <span className="text-slate-300">·</span>
                            <div className="flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-sm"
                                style={{ backgroundColor: budget.category.color }}
                              />
                              <span className="text-xs text-slate-400">{budget.category.name}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => openEdit(budget)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(budget.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Spent</span>
                      <span className={cn(
                        "font-semibold",
                        isOver ? "text-red-600" : isWarning ? "text-amber-600" : "text-slate-700",
                      )}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isOver ? "bg-red-500" : isWarning ? "bg-amber-400" : "bg-indigo-500",
                        )}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{formatCurrency(budget.spent)} spent</span>
                      <span>{formatCurrency(budget.amount)} total</span>
                    </div>
                  </div>

                  {/* Remaining */}
                  <div className={cn(
                    "mt-3 px-3 py-2 rounded-lg text-center text-xs font-medium",
                    isOver
                      ? "bg-red-50 text-red-700"
                      : isWarning
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700",
                  )}>
                    {isOver
                      ? `${formatCurrency(Math.abs(remaining))} over budget`
                      : `${formatCurrency(remaining)} remaining`}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog === "edit" ? "Edit Budget" : "New Budget"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Budget Name</Label>
              <Input {...form.register("name", { required: true })} placeholder="e.g. Monthly Operations" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("amount", { required: true, min: 0.01 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Period</Label>
                <Select
                  value={form.watch("period")}
                  onValueChange={(v) => form.setValue("period", v as BudgetPeriod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" {...form.register("startDate", { required: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date (optional)</Label>
                <Input type="date" {...form.register("endDate")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Category (optional — tracks all if blank)</Label>
              <Select
                value={form.watch("categoryId") || "all"}
                onValueChange={(v) => form.setValue("categoryId", v === "all" ? "" : v)}
              >
                <SelectTrigger>
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

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {dialog === "edit" ? "Save Changes" : "Create Budget"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Budget</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            This budget will be permanently deleted. Existing expenses will not be affected.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteConfirm && deleteMutation.mutate({ id: deleteConfirm })}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
