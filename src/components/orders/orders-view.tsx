"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { formatDate, cn } from "@/lib/utils";
import { useFormatCurrency } from "@/lib/currency-context";
import {
  Search, X, Clock, CheckCircle2, XCircle, RefreshCw, RotateCcw,
  Banknote, CreditCard, Smartphone, Building2, ChevronLeft, ChevronRight,
  ShoppingBag, User, Receipt, Tag, Hash, Package, ArrowLeft,
  AlertCircle, Wallet, Store, CalendarDays,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers/_app";

// ─── Types ───────────────────────────────────────────────────────────────────

type OrderStatus   = "PENDING" | "PROCESSING" | "FULFILLED" | "CANCELED" | "REFUNDED";
type PaymentMethod = "CASH" | "CARD" | "MOBILE_MONEY" | "BANK_TRANSFER";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Order = RouterOutput["orders"]["list"]["items"][number];

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, {
  label: string; pill: string; dot: string;
}> = {
  PENDING:    { label: "Pending",    pill: "bg-amber-50 text-amber-700 border border-amber-200",   dot: "bg-amber-400"   },
  PROCESSING: { label: "Processing", pill: "bg-blue-50 text-blue-700 border border-blue-200",      dot: "bg-blue-500"    },
  FULFILLED:  { label: "Fulfilled",  pill: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  CANCELED:   { label: "Canceled",   pill: "bg-red-50 text-red-600 border border-red-200",         dot: "bg-red-400"     },
  REFUNDED:   { label: "Refunded",   pill: "bg-slate-100 text-slate-600 border border-slate-200",  dot: "bg-slate-400"   },
};

const ALL_STATUSES: OrderStatus[] = ["PENDING", "PROCESSING", "FULFILLED", "CANCELED", "REFUNDED"];

const STATUS_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING:    ["PROCESSING", "FULFILLED", "CANCELED"],
  PROCESSING: ["FULFILLED", "CANCELED"],
};

const PAYMENT_CONFIG: Record<PaymentMethod, { label: string; Icon: React.ElementType }> = {
  CASH:          { label: "Cash",          Icon: Banknote   },
  CARD:          { label: "Card",          Icon: CreditCard },
  MOBILE_MONEY:  { label: "Mobile Money",  Icon: Smartphone },
  BANK_TRANSFER: { label: "Bank Transfer", Icon: Building2  },
};

const DATE_PRESETS = [
  { label: "Today",   days: 1  },
  { label: "7 days",  days: 7  },
  { label: "30 days", days: 30 },
  { label: "All",     days: 0  },
] as const;

const PAGE_SIZE = 15;

// ─── Status Pill ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap", cfg.pill)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─── Order Detail Panel ───────────────────────────────────────────────────────

type DetailPanelProps = {
  order: Order;
  onClose: () => void;
};

function OrderDetailPanel({ order, onClose }: DetailPanelProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const formatCurrency = useFormatCurrency();

  const [refundAmt, setRefundAmt]       = useState<string>("");
  const [refundReason, setRefundReason] = useState("");
  const [showRefund, setShowRefund]     = useState(false);

  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      utils.orders.list.invalidate();
      toast({ title: "Status updated" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const issueRefund = trpc.orders.refund.useMutation({
    onSuccess: () => {
      utils.orders.list.invalidate();
      setShowRefund(false);
      setRefundAmt("");
      setRefundReason("");
      toast({ title: "Refund issued" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const totalRefunded  = order.refunds.reduce((s: number, r: { amount: number }) => s + r.amount, 0);
  const refundable     = order.status === "FULFILLED" && totalRefunded < order.total;
  const maxRefund      = order.total - totalRefunded;
  const nextStatuses   = STATUS_TRANSITIONS[order.status as OrderStatus] ?? [];
  const payConfig      = PAYMENT_CONFIG[order.paymentMethod as PaymentMethod];
  const PayIcon        = payConfig?.Icon ?? Wallet;

  const handleRefund = () => {
    const amt = parseFloat(refundAmt);
    if (!amt || amt <= 0 || amt > maxRefund) {
      toast({ title: "Invalid amount", description: `Max refundable: ${formatCurrency(maxRefund)}`, variant: "destructive" });
      return;
    }
    issueRefund.mutate({ orderId: order.id, amount: amt, reason: refundReason || undefined });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          aria-label="Close"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-900 font-mono">{order.orderNumber}</p>
          <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
        </div>
        <StatusPill status={order.status as OrderStatus} />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-5 space-y-6">

        {/* Order meta */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</p>
            <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              {order.type === "WALK_IN" ? (
                <><Store className="h-3.5 w-3.5 text-slate-400" /> Walk-in</>
              ) : (
                <><ShoppingBag className="h-3.5 w-3.5 text-blue-400" /> Online</>
              )}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cashier</p>
            <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 truncate">
              <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{order.cashier.name}</span>
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer</p>
            <p className="text-sm font-semibold text-slate-800 truncate">
              {order.customer?.name ?? <span className="text-slate-400 font-normal">Walk-in guest</span>}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment</p>
            <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <PayIcon className="h-3.5 w-3.5 text-slate-400" />
              {payConfig?.label}
            </p>
          </div>
        </div>

        {/* Items */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Items ({order.items.length})
          </p>
          <div className="space-y-1">
            {order.items.map((item: Order["items"][number]) => (
              <div key={item.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-slate-50">
                <div className="w-7 h-7 bg-white rounded-lg border border-slate-100 flex items-center justify-center shrink-0">
                  <Package className="h-3.5 w-3.5 text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                  {item.sku && <p className="text-[10px] text-slate-400 font-mono">{item.sku}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-900 tabular-nums">
                    {formatCurrency(item.total)}
                  </p>
                  <p className="text-[10px] text-slate-400 tabular-nums">
                    ×{item.quantity} @ {formatCurrency(item.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order note */}
        {order.note && (
          <div className="flex gap-2 px-3 py-2.5 bg-amber-50 rounded-xl border border-amber-100">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 font-medium">{order.note}</p>
          </div>
        )}

        {/* Totals */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Summary</p>
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discountAmt > 0 && (
            <div className="flex justify-between text-sm font-semibold text-emerald-600">
              <span className="flex items-center gap-1.5">
                <Tag className="h-3 w-3" />
                Discount
                {order.discountType === "percentage" && ` (${order.discountValue}%)`}
              </span>
              <span className="tabular-nums">−{formatCurrency(order.discountAmt)}</span>
            </div>
          )}
          {order.taxAmt > 0 && (
            <div className="flex justify-between text-sm text-slate-500">
              <span>Tax ({order.taxRate}%)</span>
              <span className="tabular-nums">{formatCurrency(order.taxAmt)}</span>
            </div>
          )}
          {totalRefunded > 0 && (
            <div className="flex justify-between text-sm font-semibold text-red-500">
              <span className="flex items-center gap-1.5">
                <RotateCcw className="h-3 w-3" />
                Refunded
              </span>
              <span className="tabular-nums">−{formatCurrency(totalRefunded)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
            <span className="text-sm font-bold text-slate-700">Total</span>
            <span className="text-xl font-black text-slate-900 tabular-nums">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>

        {/* Status update */}
        {nextStatuses.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Update status</p>
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((s) => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => updateStatus.mutate({ id: order.id, status: s })}
                    disabled={updateStatus.isPending}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all active:scale-[0.97] disabled:opacity-50",
                      cfg.pill,
                      "hover:opacity-80"
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                    Mark as {cfg.label}
                    {updateStatus.isPending && (
                      <span className="h-3 w-3 rounded-full border border-current border-t-transparent animate-spin ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Refund section */}
        {(refundable || totalRefunded > 0) && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Refund</p>

            {totalRefunded > 0 && (
              <div className="flex items-center justify-between mb-3 px-3 py-2 bg-red-50 rounded-xl border border-red-100">
                <span className="text-xs font-semibold text-red-600 flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Refunded so far
                </span>
                <span className="text-xs font-black text-red-600 tabular-nums">
                  {formatCurrency(totalRefunded)}
                </span>
              </div>
            )}

            {refundable && !showRefund && (
              <button
                onClick={() => setShowRefund(true)}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Issue Refund (max {formatCurrency(maxRefund)})
              </button>
            )}

            {showRefund && (
              <div className="bg-red-50 rounded-xl p-4 border border-red-100 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Issue Refund
                  </p>
                  <button
                    onClick={() => { setShowRefund(false); setRefundAmt(""); setRefundReason(""); }}
                    className="text-red-400 hover:text-red-700 transition-colors"
                    aria-label="Cancel refund"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0.01}
                      max={maxRefund}
                      step={0.01}
                      placeholder={`0.00 – max ${formatCurrency(maxRefund)}`}
                      value={refundAmt}
                      onChange={(e) => setRefundAmt(e.target.value)}
                      className="w-full h-10 pl-7 pr-3 bg-white border border-red-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-red-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                  <button
                    onClick={handleRefund}
                    disabled={issueRefund.isPending || !refundAmt}
                    className="w-full h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {issueRefund.isPending ? (
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <><RotateCcw className="h-3.5 w-3.5" /> Confirm Refund</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OrdersView() {
  const formatCurrency = useFormatCurrency();
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [datePreset, setDatePreset]   = useState<0 | 1 | 7 | 30>(0);
  const [page, setPage]               = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const dateFrom = datePreset > 0
    ? (() => {
        const d = new Date();
        d.setDate(d.getDate() - (datePreset - 1));
        d.setHours(0, 0, 0, 0);
        return d;
      })()
    : undefined;

  const { data, isLoading, isFetching } = trpc.orders.list.useQuery({
    search:   search || undefined,
    status:   statusFilter !== "all" ? statusFilter : undefined,
    from:     dateFrom,
    page,
    pageSize: PAGE_SIZE,
  });

  const orders     = data?.items ?? [];
  const totalCount = data?.total ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleSearchChange = (v: string) => { setSearch(v); setPage(1); };
  const handleStatusChange = (s: OrderStatus | "all") => { setStatusFilter(s); setPage(1); };
  const handleDateChange   = (d: 0 | 1 | 7 | 30) => { setDatePreset(d); setPage(1); };

  // Sync selected order data when list refetches
  const syncedSelected = selectedOrder
    ? orders.find((o) => o.id === selectedOrder.id) ?? selectedOrder
    : null;

  return (
    <div className="flex flex-col h-full min-h-0 gap-5">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="shrink-0">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Orders</h1>
        <p className="text-sm text-slate-400 mt-0.5">Track, manage, and update all orders</p>
      </div>

      {/* ── Filters ───────────────────────────────────────────── */}
      <div className="space-y-2.5 shrink-0">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Search by order number or customer..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full h-11 pl-10 pr-10 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
          />
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status + Date chips */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Status chips */}
          <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => handleStatusChange("all")}
              className={cn(
                "flex-shrink-0 h-8 px-3 rounded-full text-xs font-semibold transition-all",
                statusFilter === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
              )}
            >
              All
            </button>
            {ALL_STATUSES.map((s: OrderStatus) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={cn(
                    "flex-shrink-0 h-8 px-3 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5",
                    statusFilter === s
                      ? `${cfg.pill} shadow-sm`
                      : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
                  )}
                >
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    statusFilter === s ? cfg.dot : "bg-slate-300"
                  )} />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Date preset chips */}
          <div className="flex gap-1.5 sm:ml-auto shrink-0">
            {DATE_PRESETS.map(({ label, days }) => (
              <button
                key={days}
                onClick={() => handleDateChange(days as 0 | 1 | 7 | 30)}
                className={cn(
                  "h-8 px-3 rounded-full text-xs font-semibold transition-all whitespace-nowrap",
                  datePreset === days
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Orders list ───────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col gap-3">

        {/* Results bar */}
        <div className="flex items-center justify-between shrink-0">
          <p className="text-sm text-slate-500">
            {isLoading ? "Loading..." : (
              <>
                <span className="font-semibold text-slate-800">{totalCount}</span>
                {" "}order{totalCount !== 1 ? "s" : ""}
                {statusFilter !== "all" && ` · ${STATUS_CONFIG[statusFilter].label}`}
                {datePreset > 0 && ` · last ${datePreset === 1 ? "day" : `${datePreset} days`}`}
              </>
            )}
          </p>
          {isFetching && !isLoading && (
            <span className="h-4 w-4 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
          )}
        </div>

        {/* Table wrapper */}
        <div className="flex-1 min-h-0 overflow-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
          {isLoading ? (
            <div className="flex flex-col gap-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-slate-50 last:border-0">
                  <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-slate-100 rounded animate-pulse flex-1" />
                  <div className="h-3 w-14 bg-slate-100 rounded animate-pulse" />
                  <div className="h-5 w-20 bg-slate-100 rounded-full animate-pulse" />
                  <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                <Receipt className="h-7 w-7 text-slate-200" />
              </div>
              <p className="text-sm font-semibold text-slate-400">No orders found</p>
              {(search || statusFilter !== "all") && (
                <button
                  onClick={() => { handleSearchChange(""); handleStatusChange("all"); }}
                  className="text-xs text-indigo-600 mt-2 hover:underline font-semibold"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <table className="hidden md:table w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Order #", "Customer", "Items", "Total", "Payment", "Status", "Date"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map((order) => {
                    const payConfig = PAYMENT_CONFIG[order.paymentMethod as PaymentMethod];
                    const PayIcon   = payConfig?.Icon ?? Wallet;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-slate-50/70 group",
                          syncedSelected?.id === order.id && "bg-indigo-50/60"
                        )}
                      >
                        <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">
                          {order.orderNumber}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn(
                            "font-medium",
                            order.customer?.name ? "text-slate-800" : "text-slate-400 italic"
                          )}>
                            {order.customer?.name ?? "Walk-in"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 tabular-nums">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900 tabular-nums whitespace-nowrap">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <PayIcon className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-xs">{payConfig?.label}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusPill status={order.status as OrderStatus} />
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-slate-50">
                {orders.map((order) => {
                  const payConfig = PAYMENT_CONFIG[order.paymentMethod as PaymentMethod];
                  const PayIcon   = payConfig?.Icon ?? Wallet;
                  return (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={cn(
                        "w-full text-left px-4 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors",
                        syncedSelected?.id === order.id && "bg-indigo-50/60"
                      )}
                    >
                      {/* Status dot */}
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full shrink-0 mt-0.5",
                        STATUS_CONFIG[order.status as OrderStatus].dot
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-700 truncate">
                            {order.orderNumber}
                          </span>
                          <span className="font-bold text-slate-900 tabular-nums shrink-0">
                            {formatCurrency(order.total)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span className="text-xs text-slate-400 truncate">
                            {order.customer?.name ?? "Walk-in"} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                          </span>
                          <StatusPill status={order.status as OrderStatus} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                          <PayIcon className="h-3 w-3" />
                          <span>{payConfig?.label}</span>
                          <span>·</span>
                          <CalendarDays className="h-3 w-3" />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
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
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <span className="text-xs text-slate-500 tabular-nums">
              Page <span className="font-bold text-slate-800">{page}</span> of <span className="font-bold text-slate-800">{totalPages}</span>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Order detail slide-over ────────────────────────────── */}
      {syncedSelected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            role="presentation"
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          />
          {/* Panel — slides from right on desktop, bottom sheet on mobile */}
          <div className="relative w-full sm:w-[480px] bg-white shadow-2xl flex flex-col h-full sm:h-full sm:rounded-l-3xl overflow-hidden">
            <OrderDetailPanel
              order={syncedSelected}
              onClose={() => setSelectedOrder(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
