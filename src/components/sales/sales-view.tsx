"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { useFormatCurrency } from "@/lib/currency-context";
import {
  Search, Plus, Minus, Trash2, Receipt, ShoppingCart,
  Banknote, CreditCard, Smartphone, Building2, Tag, X,
  CheckCircle2, ChevronUp, Package, ArrowLeft, Store,
  CalendarDays, Hash, User, Phone, UserPlus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";

// ─── Types ───────────────────────────────────────────────────────────────────

type CartItem = {
  productId: string;
  variantId?: string;
  name: string;
  sku?: string;
  price: number;
  quantity: number;
};

type PaymentMethod = "CASH" | "CARD" | "MOBILE_MONEY" | "BANK_TRANSFER";

type ShopData = { name: string; taxRate: number; taxName: string } | null | undefined;

// ─── Constants ───────────────────────────────────────────────────────────────

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: "CASH", label: "Cash", icon: Banknote },
  { value: "CARD", label: "Card", icon: CreditCard },
  { value: "MOBILE_MONEY", label: "Mobile Money", icon: Smartphone },
  { value: "BANK_TRANSFER", label: "Bank", icon: Building2 },
];

// ─── Cart Content (shared between desktop panel & mobile sheet) ───────────────

type CartContentProps = {
  cart: CartItem[];
  totalItems: number;
  subtotal: number;
  discountAmt: number;
  taxAmt: number;
  total: number;
  taxRate: number;
  shop: ShopData;
  showDiscount: boolean;
  discountType: "percentage" | "fixed" | "none";
  discountValue: number;
  paymentMethod: PaymentMethod;
  isPending: boolean;
  isSuccess: boolean;
  onClearCart: () => void;
  onUpdateQty: (idx: number, delta: number) => void;
  onRemoveItem: (idx: number) => void;
  onSetShowDiscount: (v: boolean) => void;
  onSetDiscountType: (t: "percentage" | "fixed" | "none") => void;
  onSetDiscountValue: (v: number) => void;
  onSetPaymentMethod: (m: PaymentMethod) => void;
  onOpenInvoice: () => void;
  // Customer
  customerPhone: string;
  customerName: string;
  customerId: string | null;
  foundCustomer: { id: string; name: string; phone: string | null } | null | undefined;
  onCustomerPhoneChange: (v: string) => void;
  onCustomerNameChange: (v: string) => void;
  onClearCustomer: () => void;
};

function CartContent({
  cart, totalItems, subtotal, discountAmt, taxAmt, total, taxRate, shop,
  showDiscount, discountType, discountValue, paymentMethod,
  isPending, isSuccess,
  onClearCart, onUpdateQty, onRemoveItem,
  onSetShowDiscount, onSetDiscountType, onSetDiscountValue, onSetPaymentMethod, onOpenInvoice,
  customerPhone, customerName, customerId, foundCustomer,
  onCustomerPhoneChange, onCustomerNameChange, onClearCustomer,
}: CartContentProps) {
  const formatCurrency = useFormatCurrency();
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <ShoppingCart className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none">Current Sale</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {totalItems > 0 ? `${totalItems} item${totalItems !== 1 ? "s" : ""}` : "Empty"}
            </p>
          </div>
        </div>
        {cart.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50 font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              <ShoppingCart className="h-7 w-7 text-slate-200" />
            </div>
            <p className="text-sm font-semibold text-slate-400">Cart is empty</p>
            <p className="text-xs text-slate-300 mt-1.5">Tap any product to add it</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{item.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 tabular-nums">{formatCurrency(item.price)}</p>
                </div>

                {/* Qty controls — 44px touch targets */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onUpdateQty(idx, -1)}
                    aria-label="Decrease quantity"
                    className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:border-red-200 hover:text-red-500 active:scale-95 transition-all"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-slate-900 tabular-nums select-none">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQty(idx, 1)}
                    aria-label="Increase quantity"
                    className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:border-indigo-300 hover:text-indigo-600 active:scale-95 transition-all"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <span className="text-sm font-bold text-slate-900 tabular-nums w-14 text-right shrink-0">
                  {formatCurrency(item.price * item.quantity)}
                </span>

                <button
                  onClick={() => onRemoveItem(idx)}
                  aria-label="Remove item"
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Checkout panel */}
      {cart.length > 0 && (
        <div className="px-4 pb-5 pt-3 border-t border-slate-100 space-y-4 shrink-0">

          {/* Discount */}
          {!showDiscount ? (
            <button
              onClick={() => { onSetShowDiscount(true); onSetDiscountType("percentage"); }}
              className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors py-1 group"
            >
              <Tag className="h-3.5 w-3.5 group-hover:text-indigo-500 transition-colors" />
              Add discount
            </button>
          ) : (
            <div className="bg-indigo-50 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
                  <Tag className="h-3 w-3" />
                  Discount
                </span>
                <button
                  onClick={() => { onSetShowDiscount(false); onSetDiscountType("none"); onSetDiscountValue(0); }}
                  className="text-xs text-indigo-400 hover:text-indigo-700 font-semibold transition-colors"
                >
                  Remove
                </button>
              </div>
              <div className="flex gap-2">
                <div className="flex rounded-xl overflow-hidden border border-indigo-200 bg-white shrink-0">
                  <button
                    onClick={() => onSetDiscountType("percentage")}
                    className={cn(
                      "w-10 h-10 text-xs font-bold transition-colors",
                      discountType === "percentage" ? "bg-indigo-600 text-white" : "text-indigo-500 hover:bg-indigo-50"
                    )}
                  >%</button>
                  <button
                    onClick={() => onSetDiscountType("fixed")}
                    className={cn(
                      "w-10 h-10 text-xs font-bold transition-colors border-l border-indigo-200",
                      discountType === "fixed" ? "bg-indigo-600 text-white" : "text-indigo-500 hover:bg-indigo-50"
                    )}
                  >$</button>
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={discountType === "percentage" ? 100 : undefined}
                  value={discountValue || ""}
                  placeholder="0"
                  onChange={(e) => onSetDiscountValue(parseFloat(e.target.value) || 0)}
                  className="flex-1 h-10 px-3 bg-white border border-indigo-200 rounded-xl text-sm text-right font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Customer (optional) */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <User className="h-3 w-3" />
              Customer
              <span className="text-slate-300 font-normal normal-case tracking-normal">— optional</span>
            </span>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="tel"
                inputMode="numeric"
                placeholder="Phone number..."
                value={customerPhone}
                onChange={(e) => onCustomerPhoneChange(e.target.value)}
                className="w-full h-10 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
              {customerPhone && (
                <button onClick={onClearCustomer} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {/* Found existing customer */}
            {foundCustomer && (
              <div className="flex items-center gap-2.5 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-emerald-800 truncate">{foundCustomer.name}</p>
                  <p className="text-[10px] text-emerald-600">Existing customer</p>
                </div>
              </div>
            )}
            {/* New customer — require a name */}
            {customerPhone.length >= 4 && !foundCustomer && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                  <UserPlus className="h-3 w-3" /> New customer — enter name
                </p>
                <input
                  type="text"
                  placeholder="Customer name..."
                  value={customerName}
                  onChange={(e) => onCustomerNameChange(e.target.value)}
                  className="w-full h-10 px-3 bg-amber-50 border border-amber-200 rounded-xl text-sm placeholder:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
                />
              </div>
            )}
          </div>

          {/* Payment method */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Payment method</span>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => onSetPaymentMethod(value)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm font-semibold transition-all duration-150 active:scale-[0.97]",
                    paymentMethod === value
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Order totals */}
          <div className="space-y-1.5 border-t border-slate-100 pt-3">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            {discountAmt > 0 && (
              <div className="flex justify-between text-xs font-semibold text-emerald-600">
                <span>
                  Discount
                  {discountType === "percentage" && ` (${discountValue}%)`}
                </span>
                <span className="tabular-nums">−{formatCurrency(discountAmt)}</span>
              </div>
            )}
            {taxRate > 0 && (
              <div className="flex justify-between text-xs text-slate-500">
                <span>{shop?.taxName ?? "Tax"} ({taxRate}%)</span>
                <span className="tabular-nums">{formatCurrency(taxAmt)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2.5 border-t border-slate-100">
              <span className="text-sm font-bold text-slate-600">Total</span>
              <span className="text-2xl font-black text-slate-900 tabular-nums tracking-tight">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Charge CTA — opens invoice preview first */}
          <button
            disabled={!cart.length || isPending}
            onClick={onOpenInvoice}
            className={cn(
              "w-full py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98]",
              isSuccess
                ? "bg-emerald-500 text-white shadow-sm shadow-emerald-100"
                : isPending
                  ? "bg-indigo-400 text-white cursor-wait"
                  : !cart.length
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
            )}
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Sale Complete!
              </>
            ) : isPending ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Receipt className="h-4 w-4" />
                Review & Charge {formatCurrency(total)}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Invoice Modal ────────────────────────────────────────────────────────────

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  CARD: "Card",
  MOBILE_MONEY: "Mobile Money",
  BANK_TRANSFER: "Bank Transfer",
};

const PAYMENT_ICONS: Record<PaymentMethod, React.ElementType> = {
  CASH: Banknote,
  CARD: CreditCard,
  MOBILE_MONEY: Smartphone,
  BANK_TRANSFER: Building2,
};

type InvoiceModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cart: CartItem[];
  subtotal: number;
  discountAmt: number;
  discountType: "percentage" | "fixed" | "none";
  discountValue: number;
  taxAmt: number;
  taxRate: number;
  total: number;
  paymentMethod: PaymentMethod;
  shop: ShopData;
  isPending: boolean;
  customerName?: string;
  customerPhone?: string;
};

function InvoiceModal({
  open, onClose, onConfirm,
  cart, subtotal, discountAmt, discountType, discountValue,
  taxAmt, taxRate, total, paymentMethod, shop, isPending,
  customerName, customerPhone,
}: InvoiceModalProps) {
  const formatCurrency = useFormatCurrency();
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const PayIcon = PAYMENT_ICONS[paymentMethod];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="p-0 gap-0 max-w-md w-full border-0 shadow-2xl overflow-hidden rounded-2xl sm:rounded-2xl">
        <DialogTitle className="sr-only">Invoice Preview</DialogTitle>

        {/* ── Invoice paper ── */}
        <div className="bg-white max-h-[90dvh] overflow-y-auto">

          {/* Header strip */}
          <div className="bg-slate-900 px-6 py-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                  <Store className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-black text-base leading-tight">
                    {shop?.name ?? "GenPOS"}
                  </p>
                  <p className="text-white/50 text-xs mt-0.5">Invoice Preview</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1">
                  <Receipt className="h-3 w-3 text-white/70" />
                  <span className="text-[11px] font-bold text-white/80 uppercase tracking-wide">Draft</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10 flex-wrap">
              <div className="flex items-center gap-1.5 text-white/60 text-xs">
                <CalendarDays className="h-3 w-3" />
                <span>{dateStr} · {timeStr}</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/60 text-xs">
                <Hash className="h-3 w-3" />
                <span className="font-mono">DRAFT</span>
              </div>
              {customerName && (
                <div className="flex items-center gap-1.5 text-white/70 text-xs ml-auto">
                  <User className="h-3 w-3" />
                  <span className="font-semibold">{customerName}</span>
                  {customerPhone && <span className="text-white/40">{customerPhone}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">

            {/* Items table */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Items</p>
              <div className="space-y-0">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 pb-2 border-b border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400">Product</span>
                  <span className="text-[11px] font-semibold text-slate-400 text-center">Qty</span>
                  <span className="text-[11px] font-semibold text-slate-400 text-right">Amount</span>
                </div>

                {/* Rows */}
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1fr_auto_auto] gap-x-4 py-2.5 border-b border-slate-50 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                      <p className="text-xs text-slate-400 tabular-nums">{formatCurrency(item.price)} each</p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-bold text-slate-600 tabular-nums w-8 text-center">
                        ×{item.quantity}
                      </span>
                    </div>
                    <div className="flex items-center justify-end">
                      <span className="text-sm font-bold text-slate-900 tabular-nums">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-sm font-semibold text-emerald-600">
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-3 w-3" />
                    Discount
                    {discountType === "percentage" && ` (${discountValue}%)`}
                    {discountType === "fixed" && " (fixed)"}
                  </span>
                  <span className="tabular-nums">−{formatCurrency(discountAmt)}</span>
                </div>
              )}
              {taxRate > 0 && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span>{shop?.taxName ?? "Tax"} ({taxRate}%)</span>
                  <span className="tabular-nums">{formatCurrency(taxAmt)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 mt-2">
                <span className="text-sm font-bold text-slate-700">Total due</span>
                <span className="text-2xl font-black text-slate-900 tabular-nums tracking-tight">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Payment method */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <PayIcon className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment method</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{PAYMENT_LABELS[paymentMethod]}</p>
              </div>
            </div>

            {/* Dashed receipt footer decoration */}
            <div className="flex items-center gap-1 overflow-hidden">
              {Array.from({ length: 28 }).map((_, i) => (
                <div key={i} className="w-2 h-0.5 bg-slate-200 rounded-full shrink-0" />
              ))}
            </div>

            <p className="text-center text-xs text-slate-400 -mt-1">
              Review the order above before confirming.
            </p>
          </div>

          {/* Action buttons */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={onClose}
              disabled={isPending}
              className="flex-1 h-12 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className={cn(
                "flex-[2] h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]",
                isPending
                  ? "bg-indigo-400 text-white cursor-wait"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
              )}
            >
              {isPending ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm & Charge {formatCurrency(total)}
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SalesView() {
  const { toast } = useToast();
  const formatCurrency = useFormatCurrency();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed" | "none">("none");
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [success, setSuccess] = useState(false);
  const [cartOpen, setCartOpen]       = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [flashKey, setFlashKey]       = useState<string | null>(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName]   = useState("");
  const [customerId, setCustomerId]       = useState<string | null>(null);

  const { data: productsData } = trpc.products.list.useQuery({
    search: search || undefined,
    categoryId,
    pageSize: 24,
  });
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: shop } = trpc.shop.get.useQuery();

  const { data: foundCustomer } = trpc.customers.getByPhone.useQuery(
    { phone: customerPhone },
    { enabled: customerPhone.trim().length >= 4 },
  );

  const findOrCreate = trpc.customers.findOrCreate.useMutation();

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: () => {
      setCart([]);
      setSearch("");
      setDiscountValue(0);
      setDiscountType("none");
      setShowDiscount(false);
      setCartOpen(false);
      setInvoiceOpen(false);
      setCustomerPhone("");
      setCustomerName("");
      setCustomerId(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    },
    onError: (err) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const products = productsData?.items ?? [];
  const taxRate = shop?.taxRate ?? 0;

  const cartQtyMap = new Map(cart.map((i) => [`${i.productId}-${i.variantId}`, i.quantity]));

  const addToCart = useCallback((product: (typeof products)[0]) => {
    const variantId = product.variants[0]?.id;
    const key = `${product.id}-${variantId}`;
    setFlashKey(key);
    setTimeout(() => setFlashKey(null), 350);
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id && i.variantId === variantId);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id && i.variantId === variantId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, {
        productId: product.id,
        variantId,
        name: product.name,
        sku: product.sku ?? undefined,
        price: product.price,
        quantity: 1,
      }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateQty = (idx: number, delta: number) => {
    const newQty = cart[idx].quantity + delta;
    if (newQty <= 0) setCart(cart.filter((_, i) => i !== idx));
    else setCart(cart.map((item, i) => i === idx ? { ...item, quantity: newQty } : item));
  };

  const removeItem = (idx: number) => setCart(cart.filter((_, i) => i !== idx));

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmt = discountType === "percentage"
    ? subtotal * (discountValue / 100)
    : discountType === "fixed"
      ? Math.min(discountValue, subtotal)
      : 0;
  const taxableAmt = subtotal - discountAmt;
  const taxAmt = taxableAmt * (taxRate / 100);
  const total = taxableAmt + taxAmt;
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  const handleCheckout = () => {
    if (!cart.length) return;
    const orderPayload = {
      items: cart,
      discountType: discountType === "none" ? undefined : discountType,
      discountValue,
      taxRate,
      paymentMethod,
    };
    const doCreate = (cId?: string) =>
      createOrder.mutate({ ...orderPayload, customerId: cId });

    if (customerPhone.trim().length >= 4) {
      if (customerId || foundCustomer) {
        doCreate((customerId ?? foundCustomer?.id)!);
      } else if (customerName.trim()) {
        findOrCreate.mutate(
          { phone: customerPhone.trim(), name: customerName.trim() },
          { onSuccess: (c) => doCreate(c.id) },
        );
      } else {
        doCreate();
      }
    } else {
      doCreate();
    }
  };

  const clearCustomer = () => { setCustomerPhone(""); setCustomerName(""); setCustomerId(null); };

  const cartProps: CartContentProps = {
    cart, totalItems, subtotal, discountAmt, taxAmt, total, taxRate, shop,
    showDiscount, discountType, discountValue, paymentMethod,
    isPending: createOrder.isPending || findOrCreate.isPending,
    isSuccess: success,
    onClearCart: () => setCart([]),
    onUpdateQty: updateQty,
    onRemoveItem: removeItem,
    onSetShowDiscount: setShowDiscount,
    onSetDiscountType: setDiscountType,
    onSetDiscountValue: setDiscountValue,
    onSetPaymentMethod: setPaymentMethod,
    onOpenInvoice: () => setInvoiceOpen(true),
    customerPhone,
    customerName,
    customerId,
    foundCustomer,
    onCustomerPhoneChange: (v) => { setCustomerPhone(v); setCustomerId(null); },
    onCustomerNameChange: setCustomerName,
    onClearCustomer: clearCustomer,
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-5">

      {/* ── Left: Product Browser ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 pb-28 lg:pb-0">

        {/* Page title */}
        <div className="mb-5 shrink-0">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Point of Sale</h1>
          <p className="text-sm text-slate-400 mt-0.5">Tap any product to add it to the cart</p>
        </div>

        {/* Search bar */}
        <div className="relative mb-3 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            inputMode="search"
            placeholder="Search products or scan barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-10 pr-10 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category pills */}
        {(categories ?? []).length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4 shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setCategoryId(undefined)}
              className={cn(
                "flex-shrink-0 h-9 px-4 rounded-full text-xs font-semibold transition-all duration-150",
                !categoryId
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
              )}
            >
              All
            </button>
            {(categories ?? []).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(cat.id === categoryId ? undefined : cat.id)}
                className={cn(
                  "flex-shrink-0 h-9 px-4 rounded-full text-xs font-semibold transition-all duration-150 whitespace-nowrap",
                  categoryId === cat.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto min-h-0 -mx-1 py-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 px-1 pb-4">
            {products.map((product) => {
              const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
              const variantId = product.variants[0]?.id;
              const cartQty = cartQtyMap.get(`${product.id}-${variantId}`) ?? 0;
              const inCart = cartQty > 0;
              const outOfStock = totalStock === 0;
              const isFlashing = flashKey === `${product.id}-${variantId}`;

              return (
                <button
                  key={product.id}
                  onClick={() => !outOfStock && addToCart(product)}
                  disabled={outOfStock}
                  aria-label={`Add ${product.name} to cart`}
                  className={cn(
                    "relative text-left p-4 rounded-2xl border bg-white transition-all duration-150",
                    outOfStock
                      ? "opacity-40 cursor-not-allowed border-slate-100 shadow-none"
                      : inCart
                        ? "border-indigo-300 shadow-lg shadow-indigo-50 ring-2 ring-inset ring-indigo-200"
                        : "border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 cursor-pointer active:scale-[0.96]",
                    isFlashing && !outOfStock && "bg-indigo-50 scale-[0.97]"
                  )}
                >
                  {/* In-cart badge */}
                  {inCart && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-md z-10 select-none">
                      {cartQty}
                    </span>
                  )}

                  {/* Icon area */}
                  <div className={cn(
                    "h-12 rounded-xl flex items-center justify-center mb-3 transition-colors duration-200",
                    inCart ? "bg-indigo-100" : "bg-slate-50"
                  )}>
                    <Package className={cn(
                      "h-5 w-5 transition-colors duration-200",
                      inCart ? "text-indigo-500" : "text-slate-300"
                    )} />
                  </div>

                  <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug min-h-[2.5rem] mb-1.5">
                    {product.name}
                  </p>

                  {product.category && (
                    <p className="text-[11px] text-slate-400 mb-2.5 truncate">{product.category.name}</p>
                  )}

                  <div className="flex items-center justify-between gap-1 mt-auto">
                    <span className={cn(
                      "text-sm font-black tabular-nums transition-colors",
                      inCart ? "text-indigo-600" : "text-slate-900"
                    )}>
                      {formatCurrency(product.price)}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                      outOfStock
                        ? "bg-red-50 text-red-500"
                        : totalStock <= 5
                          ? "bg-amber-50 text-amber-600"
                          : "bg-emerald-50 text-emerald-600"
                    )}>
                      {outOfStock ? "Out" : `${totalStock}`}
                    </span>
                  </div>
                </button>
              );
            })}

            {products.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center mb-4">
                  <Package className="h-7 w-7 text-slate-200" />
                </div>
                <p className="text-sm font-semibold text-slate-400">No products found</p>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-xs text-indigo-600 mt-2.5 hover:underline font-semibold"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: Cart Panel (desktop only) ─────────────────── */}
      <aside className="hidden lg:flex lg:w-[380px] xl:w-[420px] flex-col min-h-0 shrink-0">
        <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <CartContent {...cartProps} />
        </div>
      </aside>

      {/* ── Mobile: Floating cart bar ─────────────────────────── */}
      <div
        className={cn(
          "lg:hidden fixed bottom-4 left-4 right-4 z-40 transition-all duration-300",
          cart.length > 0 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
        )}
      >
        <button
          onClick={() => setCartOpen(true)}
          className="w-full flex items-center justify-between bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-4 rounded-2xl shadow-xl shadow-indigo-300/40 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-white text-indigo-600 text-[10px] font-black rounded-full flex items-center justify-center shadow-sm select-none">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="font-bold text-sm">
              {totalItems} item{totalItems !== 1 ? "s" : ""} in cart
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-base tabular-nums">{formatCurrency(total)}</span>
            <ChevronUp className="h-4 w-4 opacity-70" />
          </div>
        </button>
      </div>

      {/* ── Invoice preview modal ────────────────────────────── */}
      <InvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        onConfirm={handleCheckout}
        cart={cart}
        subtotal={subtotal}
        discountAmt={discountAmt}
        discountType={discountType}
        discountValue={discountValue}
        taxAmt={taxAmt}
        taxRate={taxRate}
        total={total}
        paymentMethod={paymentMethod}
        shop={shop}
        isPending={createOrder.isPending || findOrCreate.isPending}
        customerName={foundCustomer?.name ?? (customerPhone.length >= 4 ? customerName : undefined)}
        customerPhone={customerPhone || undefined}
      />

      {/* ── Mobile: Cart bottom sheet ─────────────────────────── */}
      {cartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            role="presentation"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          {/* Sheet */}
          <div className="relative bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[90dvh]">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <button
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
                className="w-10 h-1 bg-slate-200 rounded-full hover:bg-slate-300 transition-colors"
              />
            </div>
            <CartContent {...cartProps} />
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesView;
