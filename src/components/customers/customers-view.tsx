"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { useFormatCurrency } from "@/lib/currency-context";
import {
  Search, X, Plus, Users, Phone, Mail, MapPin,
  ArrowLeft, Pencil, Trash2, ShoppingBag, CheckCircle2,
  ChevronLeft, ChevronRight, CircleDollarSign, Clock,
  UserPlus, Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers/_app";

// ─── Types ────────────────────────────────────────────────────────────────────

type RouterOutput = inferRouterOutputs<AppRouter>;
type ListCustomer = RouterOutput["customers"]["list"][number];

type PanelState =
  | { mode: "none" }
  | { mode: "detail"; customerId: string }
  | { mode: "add" }
  | { mode: "edit"; customerId: string };

const PAGE_SIZE = 20;

// ─── Status badge for order ───────────────────────────────────────────────────

const ORDER_STATUS: Record<string, { dot: string; label: string }> = {
  PENDING:    { dot: "bg-amber-400",   label: "Pending"    },
  PROCESSING: { dot: "bg-blue-400",    label: "Processing" },
  FULFILLED:  { dot: "bg-emerald-500", label: "Fulfilled"  },
  CANCELED:   { dot: "bg-slate-300",   label: "Canceled"   },
  REFUNDED:   { dot: "bg-red-400",     label: "Refunded"   },
};

function fmtDate(d: Date | string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));
}

// ─── Customer Detail Panel ────────────────────────────────────────────────────

function CustomerDetailPanel({ customerId, onClose, onEdit }: {
  customerId: string;
  onClose: () => void;
  onEdit: (id: string) => void;
}) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const formatCurrency = useFormatCurrency();
  const { data: customer, isLoading } = trpc.customers.getById.useQuery({ id: customerId });

  const deleteCustomer = trpc.customers.delete.useMutation({
    onSuccess: () => { utils.customers.list.invalidate(); onClose(); toast({ title: "Customer deleted" }); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="flex-1 px-5 py-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const totalSpent = customer.orders.reduce((s, o) => s + o.total, 0);
  const orderCount = customer.orders.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
        <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-900 truncate">{customer.name}</p>
          <p className="text-xs text-slate-400">Customer since {fmtDate(customer.createdAt)}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-5 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-slate-900 tabular-nums">{orderCount}</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Orders</p>
          </div>
          <div className="bg-indigo-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-indigo-700 tabular-nums">{formatCurrency(totalSpent)}</p>
            <p className="text-[11px] text-indigo-400 font-semibold mt-0.5">Total Spent</p>
          </div>
        </div>

        {/* Contact info */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Contact</p>
          <div className="space-y-2">
            {customer.phone && (
              <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-sm text-slate-700 font-semibold">{customer.phone}</span>
                <span className="text-[10px] text-slate-400 ml-auto font-bold uppercase">Phone</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-sm text-slate-700 font-semibold truncate">{customer.email}</span>
                <span className="text-[10px] text-slate-400 ml-auto font-bold uppercase shrink-0">Email</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-sm text-slate-700 font-semibold truncate">{customer.address}</span>
                <span className="text-[10px] text-slate-400 ml-auto font-bold uppercase shrink-0">Address</span>
              </div>
            )}
            {!customer.phone && !customer.email && !customer.address && (
              <p className="text-xs text-slate-400 px-3">No contact info on file</p>
            )}
          </div>
        </div>

        {/* Order history */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Recent Orders ({customer.orders.length})
          </p>
          {customer.orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 bg-slate-50 rounded-xl text-center">
              <ShoppingBag className="h-6 w-6 text-slate-200 mb-2" />
              <p className="text-xs font-semibold text-slate-400">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {customer.orders.map((order) => {
                const st = ORDER_STATUS[order.status] ?? ORDER_STATUS.PENDING;
                return (
                  <div key={order.id} className="px-3 py-3 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 font-mono">{order.orderNumber}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {fmtDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-slate-900 tabular-nums">{formatCurrency(order.total)}</p>
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          <div className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
                          <span className="text-[10px] font-bold text-slate-500">{st.label}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex gap-2 shrink-0">
        <button
          onClick={() => onEdit(customer.id)}
          className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete "${customer.name}"? This cannot be undone.`)) deleteCustomer.mutate({ id: customer.id });
          }}
          disabled={deleteCustomer.isPending}
          className="h-10 w-10 flex items-center justify-center rounded-xl border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-40"
          aria-label="Delete customer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Customer Form Panel ──────────────────────────────────────────────────────

type CustomerForm = { name: string; phone: string; email: string; address: string };
const emptyForm: CustomerForm = { name: "", phone: "", email: "", address: "" };

function CustomerFormPanel({ customerId, onClose }: { customerId?: string; onClose: () => void }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const isEdit = !!customerId;

  const { data: existing, isLoading } = trpc.customers.getById.useQuery(
    { id: customerId! },
    { enabled: !!customerId },
  );

  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState<Partial<CustomerForm>>({});

  if (existing && !hydrated) {
    setForm({ name: existing.name, phone: existing.phone ?? "", email: existing.email ?? "", address: existing.address ?? "" });
    setHydrated(true);
  }

  const set = (k: keyof CustomerForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const createCustomer = trpc.customers.create.useMutation({
    onSuccess: () => { utils.customers.list.invalidate(); toast({ title: "Customer added" }); onClose(); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateCustomer = trpc.customers.update.useMutation({
    onSuccess: () => { utils.customers.list.invalidate(); utils.customers.getById.invalidate({ id: customerId! }); toast({ title: "Customer updated" }); onClose(); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const validate = () => {
    const errs: Partial<CustomerForm> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.phone.trim()) errs.phone = "Phone is required — used to identify customers";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      name:    form.name.trim(),
      phone:   form.phone.trim() || undefined,
      email:   form.email.trim() || undefined,
      address: form.address.trim() || undefined,
    };
    if (isEdit && customerId) updateCustomer.mutate({ id: customerId, ...payload });
    else createCustomer.mutate({ ...payload, name: form.name.trim() });
  };

  const isPending = createCustomer.isPending || updateCustomer.isPending;

  if (isEdit && isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="flex-1 px-5 py-5 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-11 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const Field = ({ label, name, type = "text", placeholder, hint }: {
    label: string; name: keyof CustomerForm; type?: string; placeholder?: string; hint?: string;
  }) => (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type}
        inputMode={type === "tel" ? "numeric" : undefined}
        placeholder={placeholder}
        value={form[name]}
        onChange={set(name)}
        className={cn(
          "w-full h-11 px-3 bg-white border rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors",
          errors[name] ? "border-red-300" : "border-slate-200"
        )}
      />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
      {hint && !errors[name] && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
        <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-sm font-black text-slate-900">{isEdit ? "Edit Customer" : "New Customer"}</p>
          <p className="text-xs text-slate-400">{isEdit ? `Editing: ${existing?.name ?? "…"}` : "Phone number is the unique ID"}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-5 space-y-4">
        <Field label="Full Name *" name="name" placeholder="John Doe" />
        <Field
          label="Phone Number *"
          name="phone"
          type="tel"
          placeholder="+1 555 000 0000"
          hint="Used to identify this customer across sales"
        />
        <Field label="Email" name="email" type="email" placeholder="john@example.com" />
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Address</label>
          <textarea
            rows={2}
            placeholder="123 Main St, City, Country"
            value={form.address}
            onChange={set("address")}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
      </div>

      <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex gap-2 shrink-0">
        <button onClick={onClose} className="flex-1 h-12 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-[2] h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> {isEdit ? "Save Changes" : "Add Customer"}</>}
        </button>
      </div>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function CustomersView() {
  const formatCurrency = useFormatCurrency();
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [panel, setPanel]     = useState<PanelState>({ mode: "none" });

  const { data: customers = [], isLoading, isFetching } = trpc.customers.list.useQuery({
    search: search || undefined,
  });

  const panelOpen   = panel.mode !== "none";
  const closePanel  = () => setPanel({ mode: "none" });

  // Paginate client-side (list returns all)
  const totalCount  = customers.length;
  const totalPages  = Math.ceil(totalCount / PAGE_SIZE);
  const paginated   = customers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  return (
    <div className="flex flex-col gap-5 h-full min-h-0">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customers</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {isLoading ? "Loading..." : <><span className="font-semibold text-slate-800">{totalCount}</span> customer{totalCount !== 1 ? "s" : ""}</>}
          </p>
        </div>
        <button
          onClick={() => setPanel({ mode: "add" })}
          className="flex items-center gap-2 h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-indigo-200 transition-all active:scale-[0.97] shrink-0"
        >
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      {/* ── Stats bar ──────────────────────────────────────────── */}
      {!isLoading && customers.length > 0 && (
        <div className="grid grid-cols-3 gap-3 shrink-0">
          {[
            { label: "Total",        value: customers.length,                                                           icon: Users,             color: "text-slate-900" },
            { label: "With Orders",  value: customers.filter((c) => c._count.orders > 0).length,                       icon: ShoppingBag,       color: "text-indigo-600" },
            { label: "New (30d)",    value: customers.filter((c) => Date.now() - new Date(c.createdAt).getTime() < 2592000000).length, icon: UserPlus, color: "text-emerald-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-center">
              <div className={cn("text-2xl font-black tabular-nums", color)}>{value}</div>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <Icon className="h-3 w-3 text-slate-400" />
                <p className="text-[11px] text-slate-400 font-semibold">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Search ─────────────────────────────────────────────── */}
      <div className="relative shrink-0">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full h-11 pl-10 pr-10 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
        {search && (
          <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {isFetching && !isLoading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
        )}
      </div>

      {/* ── Customer list ───────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 bg-slate-100 rounded-full animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
                  <div className="h-2.5 w-24 bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mb-4">
              <Users className="h-7 w-7 text-slate-200" />
            </div>
            <p className="text-sm font-semibold text-slate-400">
              {search ? `No customers match "${search}"` : "No customers yet"}
            </p>
            {search && (
              <button onClick={() => handleSearch("")} className="text-xs text-indigo-600 mt-2.5 hover:underline font-semibold">Clear search</button>
            )}
            {!search && (
              <button onClick={() => setPanel({ mode: "add" })} className="mt-3 text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">
                <Plus className="h-3 w-3" /> Add your first customer
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Customer", "Phone", "Email", "Orders", "Joined"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map((c) => {
                    const isSelected = panel.mode === "detail" && panel.customerId === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setPanel({ mode: "detail", customerId: c.id })}
                        className={cn("cursor-pointer transition-colors hover:bg-slate-50/70", isSelected && "bg-indigo-50/60")}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-bold text-sm text-slate-600">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-800">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">{c.phone ?? "—"}</td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs truncate max-w-[180px]">{c.email ?? "—"}</td>
                        <td className="px-5 py-3.5">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full",
                            c._count.orders > 0 ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500"
                          )}>
                            <ShoppingBag className="h-3 w-3" />
                            {c._count.orders}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-400">{fmtDate(c.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2 pb-4">
              {paginated.map((c) => {
                const isSelected = panel.mode === "detail" && panel.customerId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setPanel({ mode: "detail", customerId: c.id })}
                    className={cn(
                      "w-full text-left px-4 py-3.5 bg-white rounded-2xl border shadow-sm flex items-center gap-3 transition-all active:scale-[0.98]",
                      isSelected ? "border-indigo-300 ring-2 ring-inset ring-indigo-200" : "border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-bold text-slate-600">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">{c.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {c.phone ?? c.email ?? "No contact"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        c._count.orders > 0 ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500"
                      )}>
                        {c._count.orders} orders
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between shrink-0 py-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </button>
          <span className="text-xs text-slate-500 tabular-nums">
            Page <span className="font-bold text-slate-800">{page}</span> of <span className="font-bold text-slate-800">{totalPages}</span>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Slide-over ──────────────────────────────────────────── */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div role="presentation" className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closePanel} />
          <div className="relative w-full sm:w-[480px] bg-white shadow-2xl flex flex-col h-full sm:rounded-l-3xl overflow-hidden">
            {panel.mode === "detail" && (
              <CustomerDetailPanel
                customerId={panel.customerId}
                onClose={closePanel}
                onEdit={(id) => setPanel({ mode: "edit", customerId: id })}
              />
            )}
            {(panel.mode === "add" || panel.mode === "edit") && (
              <CustomerFormPanel
                customerId={panel.mode === "edit" ? panel.customerId : undefined}
                onClose={closePanel}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
