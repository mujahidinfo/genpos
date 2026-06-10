"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { trpc } from "@/lib/trpc/client";
import { useFormatCurrency } from "@/lib/currency-context";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useTranslation, type TranslationKey } from "@/lib/i18n/language-context";
import type { Prisma } from "@prisma/client";
import { FinanceNav } from "@/components/finance/finance-nav";

type ExpenseItem = Prisma.ExpenseGetPayload<{
  include: {
    category: true;
    employee: { select: { id: true; name: true; position: true } };
  };
}>;
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight,
  Receipt, Tag, X, Filter,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ExpenseStatus = "PAID" | "PENDING" | "CANCELLED";
type PaymentMethod = "CASH" | "CARD" | "MOBILE_MONEY" | "BANK_TRANSFER";

interface ExpenseForm {
  title: string;
  amount: number;
  date: string;
  categoryId: string;
  employeeId?: string;
  paymentMethod: PaymentMethod;
  status: ExpenseStatus;
  isRecurring: boolean;
  notes?: string;
}

interface CategoryForm {
  name: string;
  color: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ExpenseStatus, { labelKey: TranslationKey; className: string }> = {
  PAID:      { labelKey: "finance.statusPaid",      className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  PENDING:   { labelKey: "finance.statusPending",   className: "bg-amber-50 text-amber-700 border-amber-200"       },
  CANCELLED: { labelKey: "finance.statusCancelled", className: "bg-slate-100 text-slate-600 border-slate-200"      },
};

const PAYMENT_LABEL_KEYS: Record<PaymentMethod, TranslationKey> = {
  CASH: "sales.payCash", CARD: "sales.payCard", MOBILE_MONEY: "sales.payMobile", BANK_TRANSFER: "sales.payBankTransfer",
};

const PRESET_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#ec4899", "#84cc16", "#64748b",
];

const PAGE_SIZE = 15;

// ─── Main Component ───────────────────────────────────────────────────────────

export function ExpensesView() {
  const { toast } = useToast();
  const formatCurrency = useFormatCurrency();
  const { t, language } = useTranslation();
  const utils = trpc.useUtils();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState<ExpenseStatus | "">("");
  const [filterPayment, setFilterPayment] = useState<PaymentMethod | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [expenseDialog, setExpenseDialog] = useState<"add" | "edit" | null>(null);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [catDialog, setCatDialog] = useState(false);

  const { data, isLoading } = trpc.finance.expenses.list.useQuery({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    categoryId: filterCategory || undefined,
    status: filterStatus || undefined,
    paymentMethod: filterPayment || undefined,
    from: fromDate ? new Date(fromDate) : undefined,
    to: toDate ? new Date(toDate) : undefined,
  });

  const { data: categories } = trpc.finance.expenseCategories.list.useQuery();
  const { data: employees } = trpc.finance.employees.list.useQuery();

  const createMutation = trpc.finance.expenses.create.useMutation({
    onSuccess: () => {
      utils.finance.expenses.list.invalidate();
      utils.finance.overview.invalidate();
      setExpenseDialog(null);
      toast({ title: t("finance.expenseAdded") });
    },
    onError: (e) => toast({ title: e.message, variant: "destructive" }),
  });

  const updateMutation = trpc.finance.expenses.update.useMutation({
    onSuccess: () => {
      utils.finance.expenses.list.invalidate();
      utils.finance.overview.invalidate();
      setExpenseDialog(null);
      toast({ title: t("finance.expenseUpdated") });
    },
    onError: (e) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteMutation = trpc.finance.expenses.delete.useMutation({
    onSuccess: () => {
      utils.finance.expenses.list.invalidate();
      utils.finance.overview.invalidate();
      setDeleteConfirm(null);
      toast({ title: t("finance.expenseDeleted") });
    },
    onError: (e) => toast({ title: e.message, variant: "destructive" }),
  });

  const expenseForm = useForm<ExpenseForm>({
    defaultValues: {
      title: "", amount: 0, date: new Date().toISOString().split("T")[0],
      categoryId: "", paymentMethod: "CASH", status: "PAID", isRecurring: false,
    },
  });

  function openAdd() {
    expenseForm.reset({
      title: "", amount: 0, date: new Date().toISOString().split("T")[0],
      categoryId: categories?.[0]?.id ?? "", paymentMethod: "CASH", status: "PAID", isRecurring: false,
    });
    setEditingExpense(null);
    setExpenseDialog("add");
  }

  function openEdit(expense: ExpenseItem) {
    expenseForm.reset({
      title: expense.title,
      amount: expense.amount,
      date: new Date(expense.date).toISOString().split("T")[0],
      categoryId: expense.categoryId,
      employeeId: expense.employeeId ?? undefined,
      paymentMethod: expense.paymentMethod as PaymentMethod,
      status: expense.status as ExpenseStatus,
      isRecurring: expense.isRecurring,
      notes: expense.notes ?? undefined,
    });
    setEditingExpense(expense.id);
    setExpenseDialog("edit");
  }

  function onSubmitExpense(values: ExpenseForm) {
    const payload = {
      ...values,
      amount: Number(values.amount),
      date: new Date(values.date),
      employeeId: values.employeeId || undefined,
      notes: values.notes || undefined,
    };
    if (expenseDialog === "edit" && editingExpense) {
      updateMutation.mutate({ id: editingExpense, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const hasFilters = search || filterCategory || filterStatus || filterPayment || fromDate || toDate;

  function clearFilters() {
    setSearch(""); setFilterCategory(""); setFilterStatus("");
    setFilterPayment(""); setFromDate(""); setToDate(""); setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("finance.title")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t("finance.expensesSubtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCatDialog(true)}>
            <Tag className="h-4 w-4 mr-1.5" />
            {t("finance.categories")}
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1.5" />
            {t("finance.addExpense")}
          </Button>
        </div>
      </div>

      <FinanceNav />

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={t("finance.searchExpenses")}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 h-9"
              />
            </div>

            <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder={t("finance.allCategories")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("finance.allCategories")}</SelectItem>
                {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === "all" ? "" : v as ExpenseStatus); setPage(1); }}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder={t("finance.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("finance.allStatuses")}</SelectItem>
                <SelectItem value="PAID">{t("finance.statusPaid")}</SelectItem>
                <SelectItem value="PENDING">{t("finance.statusPending")}</SelectItem>
                <SelectItem value="CANCELLED">{t("finance.statusCancelled")}</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1.5">
              <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="h-9 w-36 text-sm" />
              <span className="text-slate-400 text-xs">{t("finance.to")}</span>
              <Input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="h-9 w-36 text-sm" />
            </div>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-slate-500">
                <X className="h-3.5 w-3.5 mr-1" />
                {t("finance.clear")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (data?.items.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Receipt className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">{t("finance.noExpensesFound")}</p>
              {hasFilters && (
                <button onClick={clearFilters} className="mt-2 text-xs text-indigo-500 hover:underline">
                  {t("finance.clearFilters")}
                </button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead>{t("finance.colTitle")}</TableHead>
                    <TableHead>{t("finance.colCategory")}</TableHead>
                    <TableHead>{t("finance.colAmount")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("finance.colDate")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("finance.colPayment")}</TableHead>
                    <TableHead>{t("finance.colStatus")}</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.items as ExpenseItem[] | undefined)?.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{expense.title}</p>
                          {expense.employee && (
                            <p className="text-xs text-slate-400">{expense.employee.name}</p>
                          )}
                          {expense.isRecurring && (
                            <span className="text-[10px] text-indigo-500 font-medium">{t("finance.recurring")}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: expense.category.color }}
                          />
                          <span className="text-sm text-slate-600">{expense.category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-slate-900 text-sm">
                          {formatCurrency(expense.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-slate-500">
                        {new Date(expense.date).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-slate-500">
                        {t(PAYMENT_LABEL_KEYS[expense.paymentMethod as PaymentMethod])}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border",
                            STATUS_CONFIG[expense.status as ExpenseStatus].className,
                          )}
                        >
                          {t(STATUS_CONFIG[expense.status as ExpenseStatus].labelKey)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(expense)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(expense.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {(data?.pages ?? 0) > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    {t("finance.paginationRange", { from: (page - 1) * PAGE_SIZE + 1, to: Math.min(page * PAGE_SIZE, data?.total ?? 0), total: data?.total ?? 0 })}
                  </p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= (data?.pages ?? 1)} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={expenseDialog !== null} onOpenChange={(o) => !o && setExpenseDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{expenseDialog === "edit" ? t("finance.editExpense") : t("finance.addExpense")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={expenseForm.handleSubmit(onSubmitExpense)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{t("finance.fieldTitle")}</Label>
              <Input {...expenseForm.register("title", { required: true })} placeholder={t("finance.titlePlaceholder")} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("finance.fieldAmount")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...expenseForm.register("amount", { required: true, min: 0.01 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("finance.fieldDate")}</Label>
                <Input type="date" {...expenseForm.register("date", { required: true })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("finance.fieldCategory")}</Label>
              <Select
                value={expenseForm.watch("categoryId")}
                onValueChange={(v) => expenseForm.setValue("categoryId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("finance.selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("finance.fieldPaymentMethod")}</Label>
                <Select
                  value={expenseForm.watch("paymentMethod")}
                  onValueChange={(v) => expenseForm.setValue("paymentMethod", v as PaymentMethod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">{t("sales.payCash")}</SelectItem>
                    <SelectItem value="CARD">{t("sales.payCard")}</SelectItem>
                    <SelectItem value="MOBILE_MONEY">{t("sales.payMobile")}</SelectItem>
                    <SelectItem value="BANK_TRANSFER">{t("sales.payBankTransfer")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("finance.fieldStatus")}</Label>
                <Select
                  value={expenseForm.watch("status")}
                  onValueChange={(v) => expenseForm.setValue("status", v as ExpenseStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAID">{t("finance.statusPaid")}</SelectItem>
                    <SelectItem value="PENDING">{t("finance.statusPending")}</SelectItem>
                    <SelectItem value="CANCELLED">{t("finance.statusCancelled")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(employees?.items.length ?? 0) > 0 && (
              <div className="space-y-1.5">
                <Label>{t("finance.employeeOptional")}</Label>
                <Select
                  value={expenseForm.watch("employeeId") ?? "none"}
                  onValueChange={(v) => expenseForm.setValue("employeeId", v === "none" ? undefined : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("finance.none")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("finance.none")}</SelectItem>
                    {employees?.items.filter(e => e.isActive).map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name} — {e.position}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>{t("finance.notesOptional")}</Label>
              <Input {...expenseForm.register("notes")} placeholder={t("finance.notesPlaceholder")} />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                {...expenseForm.register("isRecurring")}
                className="rounded border-slate-300"
              />
              <Label htmlFor="recurring" className="font-normal cursor-pointer">
                {t("finance.recurringExpense")}
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setExpenseDialog(null)}>
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {expenseDialog === "edit" ? t("common.saveChanges") : t("finance.addExpense")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("finance.deleteExpense")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            {t("finance.deleteExpenseDesc")}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>{t("common.cancel")}</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteConfirm && deleteMutation.mutate({ id: deleteConfirm })}
            >
              {t("common.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Manager */}
      <CategoryDialog open={catDialog} onOpenChange={setCatDialog} />
    </div>
  );
}

// ─── Category Manager Dialog ──────────────────────────────────────────────────

function CategoryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { data: categories } = trpc.finance.expenseCategories.list.useQuery();

  const createCat = trpc.finance.expenseCategories.create.useMutation({
    onSuccess: () => { utils.finance.expenseCategories.list.invalidate(); catForm.reset({ name: "", color: "#6366f1" }); toast({ title: t("finance.categoryCreated") }); },
    onError: (e) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteCat = trpc.finance.expenseCategories.delete.useMutation({
    onSuccess: () => { utils.finance.expenseCategories.list.invalidate(); toast({ title: t("finance.categoryDeleted") }); },
    onError: (e) => toast({ title: e.message, variant: "destructive" }),
  });

  const catForm = useForm<CategoryForm>({ defaultValues: { name: "", color: "#6366f1" } });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("finance.manageCategories")}</DialogTitle>
        </DialogHeader>

        {/* Existing categories */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {(categories?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">{t("finance.noCategories")}</p>
          ) : (
            categories?.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                  <span className="text-xs text-slate-400">({cat._count.expenses})</span>
                </div>
                <button
                  onClick={() => cat._count.expenses === 0 && deleteCat.mutate({ id: cat.id })}
                  disabled={cat._count.expenses > 0 || deleteCat.isPending}
                  className={cn(
                    "p-1 rounded text-slate-400 transition-colors",
                    cat._count.expenses === 0
                      ? "hover:text-red-500 hover:bg-red-50"
                      : "opacity-30 cursor-not-allowed",
                  )}
                  title={cat._count.expenses > 0 ? t("finance.inUseCannotDelete") : t("common.delete")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add new */}
        <form
          onSubmit={catForm.handleSubmit((v) => createCat.mutate(v))}
          className="flex gap-2 pt-2 border-t border-slate-100"
        >
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500">{t("finance.colorLabel")}</label>
            <input
              type="color"
              {...catForm.register("color")}
              className="h-8 w-10 rounded cursor-pointer border border-slate-200"
            />
          </div>
          <Input
            {...catForm.register("name", { required: true })}
            placeholder={t("finance.categoryNamePlaceholder")}
            className="flex-1 h-9"
          />
          <Button type="submit" size="sm" disabled={createCat.isPending}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        <div className="flex flex-wrap gap-1.5 mt-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => catForm.setValue("color", c)}
              className="w-5 h-5 rounded-sm border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: catForm.watch("color") === c ? "#1e293b" : "transparent",
              }}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
