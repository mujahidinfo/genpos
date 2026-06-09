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
import {
  Plus, Pencil, Users, DollarSign, UserCheck, UserX, Briefcase,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type SalaryType = "MONTHLY" | "HOURLY" | "WEEKLY" | "ANNUALLY";

interface EmployeeForm {
  name: string;
  email: string;
  phone: string;
  position: string;
  salary: number;
  salaryType: SalaryType;
  joinDate: string;
  notes: string;
}

const SALARY_LABELS: Record<SalaryType, string> = {
  MONTHLY: "Monthly", HOURLY: "Hourly", WEEKLY: "Weekly", ANNUALLY: "Annually",
};

function toMonthlySalary(salary: number, type: SalaryType): number {
  switch (type) {
    case "HOURLY":   return salary * 160;
    case "WEEKLY":   return salary * 4.33;
    case "ANNUALLY": return salary / 12;
    default:         return salary;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EmployeesView() {
  const { toast } = useToast();
  const formatCurrency = useFormatCurrency();
  const utils = trpc.useUtils();

  const [dialog, setDialog] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const { data, isLoading } = trpc.finance.employees.list.useQuery();

  const createMutation = trpc.finance.employees.create.useMutation({
    onSuccess: () => {
      utils.finance.employees.list.invalidate();
      setDialog(null);
      toast({ title: "Employee added" });
    },
    onError: (e) => toast({ title: e.message, variant: "destructive" }),
  });

  const updateMutation = trpc.finance.employees.update.useMutation({
    onSuccess: () => {
      utils.finance.employees.list.invalidate();
      utils.finance.overview.invalidate();
      setDialog(null);
      toast({ title: "Employee updated" });
    },
    onError: (e) => toast({ title: e.message, variant: "destructive" }),
  });

  const form = useForm<EmployeeForm>({
    defaultValues: {
      name: "", email: "", phone: "", position: "",
      salary: 0, salaryType: "MONTHLY",
      joinDate: new Date().toISOString().split("T")[0], notes: "",
    },
  });

  function openAdd() {
    form.reset({
      name: "", email: "", phone: "", position: "",
      salary: 0, salaryType: "MONTHLY",
      joinDate: new Date().toISOString().split("T")[0], notes: "",
    });
    setEditingId(null);
    setDialog("add");
  }

  function openEdit(emp: NonNullable<typeof data>["items"][number]) {
    form.reset({
      name: emp.name,
      email: emp.email ?? "",
      phone: emp.phone ?? "",
      position: emp.position,
      salary: emp.salary,
      salaryType: emp.salaryType as SalaryType,
      joinDate: new Date(emp.joinDate).toISOString().split("T")[0],
      notes: emp.notes ?? "",
    });
    setEditingId(emp.id);
    setDialog("edit");
  }

  function onSubmit(values: EmployeeForm) {
    const payload = {
      name: values.name,
      email: values.email || undefined,
      phone: values.phone || undefined,
      position: values.position,
      salary: Number(values.salary),
      salaryType: values.salaryType,
      joinDate: new Date(values.joinDate),
      notes: values.notes || undefined,
    };
    if (dialog === "edit" && editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function toggleActive(id: string, current: boolean) {
    updateMutation.mutate({ id, isActive: !current });
  }

  const activeEmployees = data?.items.filter((e) => e.isActive) ?? [];
  const inactiveEmployees = data?.items.filter((e) => !e.isActive) ?? [];
  const displayed = showInactive ? data?.items ?? [] : activeEmployees;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Finance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Employee salary management</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Employee
        </Button>
      </div>

      <FinanceNav />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Staff</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{activeEmployees.length}</p>
                <p className="text-xs text-slate-400 mt-0.5">{inactiveEmployees.length} inactive</p>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Monthly Payroll</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {isLoading ? "—" : formatCurrency(data?.totalMonthlySalary ?? 0)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Estimated total</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg. Salary</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {isLoading || activeEmployees.length === 0
                    ? "—"
                    : formatCurrency((data?.totalMonthlySalary ?? 0) / activeEmployees.length)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Per employee / month</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50">
                <Briefcase className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toggle inactive */}
      {inactiveEmployees.length > 0 && (
        <button
          onClick={() => setShowInactive((v) => !v)}
          className="text-sm text-indigo-600 hover:underline"
        >
          {showInactive ? "Hide inactive employees" : `Show ${inactiveEmployees.length} inactive employee(s)`}
        </button>
      )}

      {/* Employee Cards */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Users className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No employees yet</p>
          <p className="text-xs mt-1">Add your first employee to track salaries</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((emp) => {
            const monthly = toMonthlySalary(emp.salary, emp.salaryType as SalaryType);
            return (
              <Card
                key={emp.id}
                className={cn(
                  "transition-shadow hover:shadow-md",
                  !emp.isActive && "opacity-60",
                )}
              >
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                      {emp.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(emp)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => toggleActive(emp.id, emp.isActive)}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          emp.isActive
                            ? "hover:bg-red-50 text-slate-400 hover:text-red-600"
                            : "hover:bg-emerald-50 text-slate-400 hover:text-emerald-600",
                        )}
                        title={emp.isActive ? "Deactivate" : "Reactivate"}
                      >
                        {emp.isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">{emp.name}</p>
                    <p className="text-sm text-slate-500">{emp.position}</p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Salary</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {formatCurrency(emp.salary)} / {SALARY_LABELS[emp.salaryType as SalaryType].toLowerCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Monthly est.</span>
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(monthly)}</span>
                    </div>
                    {emp.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Email</span>
                        <span className="text-xs text-slate-600 truncate max-w-[140px]">{emp.email}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Joined</span>
                      <span className="text-xs text-slate-600">
                        {new Date(emp.joinDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {!emp.isActive && (
                    <div className="mt-2 px-2 py-1 bg-slate-100 rounded text-center">
                      <span className="text-xs text-slate-500 font-medium">Inactive</span>
                    </div>
                  )}
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
            <DialogTitle>{dialog === "edit" ? "Edit Employee" : "Add Employee"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input {...form.register("name", { required: true })} placeholder="John Doe" />
            </div>

            <div className="space-y-1.5">
              <Label>Position / Role</Label>
              <Input {...form.register("position", { required: true })} placeholder="e.g. Store Manager" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Salary</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("salary", { required: true, min: 0.01 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Salary Type</Label>
                <Select
                  value={form.watch("salaryType")}
                  onValueChange={(v) => form.setValue("salaryType", v as SalaryType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="HOURLY">Hourly</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="ANNUALLY">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Join Date</Label>
              <Input type="date" {...form.register("joinDate", { required: true })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email (optional)</Label>
                <Input {...form.register("email")} type="email" placeholder="john@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone (optional)</Label>
                <Input {...form.register("phone")} placeholder="+1 234 567 890" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input {...form.register("notes")} placeholder="Additional notes…" />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {dialog === "edit" ? "Save Changes" : "Add Employee"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
