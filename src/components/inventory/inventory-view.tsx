"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { useFormatCurrency } from "@/lib/currency-context";
import { useTranslation, type TranslationKey } from "@/lib/i18n/language-context";
import type { Language } from "@/lib/i18n/translations";
import {
  Search, X, Plus, AlertTriangle, Package, ArrowUpCircle, ArrowDownCircle,
  RotateCcw, RefreshCw, ChevronLeft, ChevronRight, Pencil, Trash2,
  ArrowLeft, LayoutGrid, LayoutList,
  CheckCircle2, ChevronDown, ChevronUp,
  Boxes, FolderOpen, Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers/_app";

// ─── Types ───────────────────────────────────────────────────────────────────

type RouterOutput = inferRouterOutputs<AppRouter>;
type Category     = RouterOutput["categories"]["list"][number];
type MoveType     = "IN" | "OUT" | "ADJUSTMENT" | "RETURN";

type PanelState =
  | { mode: "none" }
  | { mode: "detail"; productId: string }
  | { mode: "add" }
  | { mode: "edit"; productId: string };

const PAGE_SIZE = 16;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MOVE_CONFIG: Record<MoveType, { labelKey: TranslationKey; shortKey: TranslationKey; color: string; Icon: React.ElementType }> = {
  IN:         { labelKey: "inventory.moveIn",         shortKey: "inventory.moveInShort",     color: "text-emerald-600 bg-emerald-50", Icon: ArrowUpCircle   },
  OUT:        { labelKey: "inventory.moveOut",        shortKey: "inventory.moveOutShort",    color: "text-red-500 bg-red-50",         Icon: ArrowDownCircle },
  ADJUSTMENT: { labelKey: "inventory.moveAdjustment", shortKey: "inventory.moveSet",         color: "text-blue-600 bg-blue-50",       Icon: RefreshCw       },
  RETURN:     { labelKey: "inventory.moveReturn",     shortKey: "inventory.moveReturnShort", color: "text-violet-600 bg-violet-50",   Icon: RotateCcw       },
};

function stockStatus(stock: number, lowStock: number) {
  if (stock === 0)        return { labelKey: "inventory.statusOut" as TranslationKey,     pill: "bg-red-50 text-red-500 border-red-200 border",      bar: "bg-red-400"     } as const;
  if (stock <= lowStock)  return { labelKey: "inventory.statusLow" as TranslationKey,     pill: "bg-amber-50 text-amber-700 border-amber-200 border", bar: "bg-amber-400"   } as const;
  return                         { labelKey: "inventory.statusInStock" as TranslationKey, pill: "bg-emerald-50 text-emerald-700 border-emerald-200 border", bar: "bg-emerald-500" } as const;
}

function formatDate(date: Date | string, language: Language) {
  return new Intl.DateTimeFormat(language === "bn" ? "bn-BD" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

// ─── Product Detail Slide-over ────────────────────────────────────────────────

function ProductDetailPanel({ productId, onClose, onEdit }: {
  productId: string;
  onClose: () => void;
  onEdit: (id: string) => void;
}) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const formatCurrency = useFormatCurrency();
  const { t, language } = useTranslation();

  const { data: product, isLoading } = trpc.products.getById.useQuery({ id: productId });

  const [adjVariantId, setAdjVariantId] = useState("");
  const [adjType, setAdjType]           = useState<MoveType>("IN");
  const [adjQty, setAdjQty]             = useState("");
  const [adjNote, setAdjNote]           = useState("");
  const [showHistory, setShowHistory]   = useState(false);

  const activeVariantId = adjVariantId || product?.variants[0]?.id || "";

  const adjustStock = trpc.products.adjustStock.useMutation({
    onSuccess: (data) => {
      utils.products.list.invalidate();
      utils.products.getById.invalidate({ id: productId });
      setAdjQty("");
      setAdjNote("");
      toast({ title: t("inventory.stockUpdated", { stock: data.stock }) });
    },
    onError: (e) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      onClose();
      toast({ title: t("inventory.productArchived") });
    },
    onError: (e) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const handleAdjust = () => {
    const qty = parseInt(adjQty);
    if (!qty || qty <= 0 || !activeVariantId) return;
    adjustStock.mutate({ productId, variantId: activeVariantId, type: adjType, quantity: qty, note: adjNote || undefined });
  };

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
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!product) return null;

  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
  const isLow = product.variants.some((v) => v.stock <= v.lowStock);
  const st = stockStatus(totalStock, product.variants[0]?.lowStock ?? 5);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
        <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-900 truncate">{product.name}</p>
          {product.category && <p className="text-xs text-slate-400">{product.category.name}</p>}
        </div>
        <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full", st.pill)}>
          {t(st.labelKey)}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-5 space-y-6">

        {/* Product info grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t("inventory.price")}</p>
            <p className="text-sm font-black text-slate-900">{formatCurrency(product.price)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t("inventory.cost")}</p>
            <p className="text-sm font-semibold text-slate-700">{formatCurrency(product.costPrice)}</p>
          </div>
          {product.sku && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t("inventory.sku")}</p>
              <p className="text-sm font-mono font-semibold text-slate-800">{product.sku}</p>
            </div>
          )}
          {product.barcode && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t("inventory.barcode")}</p>
              <p className="text-sm font-mono font-semibold text-slate-800 truncate">{product.barcode}</p>
            </div>
          )}
          <div className="bg-slate-50 rounded-xl p-3 col-span-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t("inventory.totalStock")}</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-slate-900">{totalStock} {t("inventory.units")}</p>
              {isLow && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
            </div>
          </div>
        </div>

        {product.description && (
          <p className="text-sm text-slate-500 leading-relaxed">{product.description}</p>
        )}

        {/* Variants */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            {t("inventory.variants", { count: product.variants.length })}
          </p>
          <div className="space-y-2">
            {product.variants.map((v) => {
              const vs = stockStatus(v.stock, v.lowStock);
              return (
                <div key={v.id} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl">
                  <div className={cn("w-2 h-2 rounded-full shrink-0", vs.bar)} />
                  <span className="text-sm font-semibold text-slate-800 flex-1 truncate">{v.name}</span>
                  {v.sku && <span className="text-[11px] font-mono text-slate-400">{v.sku}</span>}
                  <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0", vs.pill)}>
                    {v.stock}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stock adjustment */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t("inventory.adjustStock")}</p>
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            {/* Variant select (only if multiple) */}
            {product.variants.length > 1 && (
              <select
                value={activeVariantId}
                onChange={(e) => setAdjVariantId(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {product.variants.map((v) => (
                  <option key={v.id} value={v.id}>{t("inventory.variantStock", { name: v.name, stock: v.stock })}</option>
                ))}
              </select>
            )}

            {/* Movement type */}
            <div className="grid grid-cols-4 gap-1.5">
              {(["IN", "OUT", "ADJUSTMENT", "RETURN"] as MoveType[]).map((mt) => {
                const cfg = MOVE_CONFIG[mt];
                return (
                  <button
                    key={mt}
                    onClick={() => setAdjType(mt)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold border transition-all",
                      adjType === mt
                        ? `${cfg.color} border-current`
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    )}
                  >
                    <cfg.Icon className="h-3.5 w-3.5" />
                    {t(cfg.shortKey)}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-500">
              {adjType === "IN"         && t("inventory.helpIn")}
              {adjType === "OUT"        && t("inventory.helpOut")}
              {adjType === "ADJUSTMENT" && t("inventory.helpAdjustment")}
              {adjType === "RETURN"     && t("inventory.helpReturn")}
            </p>

            <div className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                placeholder={t("inventory.qty")}
                value={adjQty}
                onChange={(e) => setAdjQty(e.target.value)}
                className="w-24 h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder={t("inventory.noteOptional")}
                value={adjNote}
                onChange={(e) => setAdjNote(e.target.value)}
                className="flex-1 h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAdjust}
                disabled={!adjQty || adjustStock.isPending}
                className="h-10 px-4 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97]"
              >
                {adjustStock.isPending
                  ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  : <><Save className="h-3.5 w-3.5" /> {t("common.save")}</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Stock history */}
        {product.stockMovements.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 hover:text-slate-600 transition-colors"
            >
              {t("inventory.history", { count: product.stockMovements.length })}
              {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showHistory && (
              <div className="space-y-1.5">
                {product.stockMovements.map((m) => {
                  const cfg = MOVE_CONFIG[m.type as MoveType];
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", cfg.color)}>
                        <cfg.Icon className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700">{t(cfg.labelKey)}</p>
                        {m.note && <p className="text-[11px] text-slate-400 truncate">{m.note}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn("text-xs font-bold tabular-nums", cfg.color.split(" ")[0])}>
                          {m.type === "ADJUSTMENT" ? `→ ${m.quantity}` : m.type === "OUT" ? `−${m.quantity}` : `+${m.quantity}`}
                        </p>
                        <p className="text-[10px] text-slate-400">{formatDate(m.createdAt, language)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex gap-2 shrink-0">
        <button
          onClick={() => onEdit(product.id)}
          className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
        >
          <Pencil className="h-3.5 w-3.5" />
          {t("common.edit")}
        </button>
        <button
          onClick={() => {
            if (confirm(t("inventory.archiveConfirm", { name: product.name }))) {
              deleteProduct.mutate({ id: product.id });
            }
          }}
          disabled={deleteProduct.isPending}
          className="h-10 w-10 flex items-center justify-center rounded-xl border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-40"
          aria-label={t("inventory.archiveProduct")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Product Form Panel (Create / Edit) ───────────────────────────────────────

type FormState = {
  name: string; description: string; sku: string; barcode: string;
  price: string; costPrice: string; categoryId: string; imageUrl: string;
};

function ProductFormPanel({ productId, categories, onClose }: {
  productId?: string;
  categories: Category[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { t } = useTranslation();
  const isEdit = !!productId;

  const { data: product, isLoading: loadingProduct } = trpc.products.getById.useQuery(
    { id: productId! },
    { enabled: !!productId },
  );

  const empty: FormState = { name: "", description: "", sku: "", barcode: "", price: "", costPrice: "0", categoryId: "", imageUrl: "" };
  const [form, setForm] = useState<FormState>(empty);
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // Populate form when editing product loads
  if (product && !hydrated) {
    setForm({
      name:        product.name,
      description: product.description ?? "",
      sku:         product.sku ?? "",
      barcode:     product.barcode ?? "",
      price:       product.price.toString(),
      costPrice:   product.costPrice.toString(),
      categoryId:  product.categoryId ?? "",
      imageUrl:    product.imageUrl ?? "",
    });
    setHydrated(true);
  }

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim())                          errs.name  = t("inventory.nameRequired");
    if (!form.price || parseFloat(form.price) <= 0) errs.price = t("inventory.validPrice");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast({ title: t("inventory.productCreated") });
      onClose();
    },
    onError: (e) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast({ title: t("inventory.productUpdated") });
      onClose();
    },
    onError: (e) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      name:        form.name.trim(),
      description: form.description.trim() || undefined,
      sku:         form.sku.trim() || undefined,
      barcode:     form.barcode.trim() || undefined,
      price:       parseFloat(form.price),
      costPrice:   parseFloat(form.costPrice) || 0,
      categoryId:  form.categoryId || undefined,
      imageUrl:    form.imageUrl.trim() || undefined,
    };
    if (isEdit && productId) {
      updateProduct.mutate({ id: productId, ...payload });
    } else {
      createProduct.mutate({ ...payload, variants: [{ name: "Default", stock: 0, lowStock: 5 }] });
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  const Field = ({ label, name, type = "text", placeholder }: {
    label: string; name: keyof FormState; type?: string; placeholder?: string;
  }) => (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        placeholder={placeholder}
        value={form[name]}
        onChange={set(name)}
        className={cn(
          "w-full h-11 px-3 bg-white border rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors",
          errors[name] ? "border-red-300 ring-1 ring-red-200" : "border-slate-200"
        )}
      />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  if (isEdit && loadingProduct) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="flex-1 px-5 py-5 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-11 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
        <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-sm font-black text-slate-900">{isEdit ? t("inventory.editProduct") : t("inventory.newProduct")}</p>
          <p className="text-xs text-slate-400">{isEdit ? t("inventory.editingName", { name: product?.name ?? "…" }) : t("inventory.fillDetails")}</p>
        </div>
      </div>

      {/* Form body */}
      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-5 space-y-4">

        <Field label={`${t("inventory.productName")} *`} name="name" placeholder={t("inventory.namePlaceholder")} />

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {t("common.description")}
          </label>
          <textarea
            rows={3}
            placeholder={t("inventory.descriptionPlaceholder")}
            value={form.description}
            onChange={set("description")}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={`${t("inventory.sellingPrice")} *`} name="price" type="number" placeholder="0.00" />
          <Field label={t("inventory.costPrice")}      name="costPrice" type="number" placeholder="0.00" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("inventory.sku")}     name="sku"     placeholder="ABC-001" />
          <Field label={t("inventory.barcode")} name="barcode" placeholder="1234567890" />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {t("inventory.category")}
          </label>
          <select
            value={form.categoryId}
            onChange={set("categoryId")}
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{t("inventory.noCategory")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <Field label={t("inventory.imageUrl")} name="imageUrl" placeholder="https://..." />

        {!isEdit && (
          <div className="flex gap-2.5 px-4 py-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <Boxes className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700 font-medium">
              {t("inventory.defaultVariantNote")}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex gap-2 shrink-0">
        <button
          onClick={onClose}
          className="flex-1 h-12 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
        >
          {t("common.cancel")}
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-[2] h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? (
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <><CheckCircle2 className="h-4 w-4" /> {isEdit ? t("common.saveChanges") : t("inventory.createProduct")}</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Categories Manager ───────────────────────────────────────────────────────

function CategoryManager({ categories, onRefresh }: {
  categories: Category[];
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { t } = useTranslation();
  const [newName, setNewName]     = useState("");
  const [newColor, setNewColor]   = useState("#6366f1");
  const [editId, setEditId]       = useState<string | null>(null);
  const [editName, setEditName]   = useState("");

  const createCat = trpc.categories.create.useMutation({
    onSuccess: () => { utils.categories.list.invalidate(); setNewName(""); toast({ title: t("inventory.categoryCreated") }); },
    onError: (e) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const updateCat = trpc.categories.update.useMutation({
    onSuccess: () => { utils.categories.list.invalidate(); setEditId(null); toast({ title: t("inventory.categoryUpdated") }); },
    onError: (e) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const deleteCat = trpc.categories.delete.useMutation({
    onSuccess: () => { utils.categories.list.invalidate(); toast({ title: t("inventory.categoryDeleted") }); },
    onError: (e) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-5">
      {/* Add new */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t("inventory.newCategory")}</p>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 flex-1">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
              title={t("inventory.pickColor")}
            />
            <input
              type="text"
              placeholder={t("inventory.categoryNamePlaceholder")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && newName.trim() && createCat.mutate({ name: newName.trim(), color: newColor })}
              className="flex-1 h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => newName.trim() && createCat.mutate({ name: newName.trim(), color: newColor })}
            disabled={!newName.trim() || createCat.isPending}
            className="h-10 px-4 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-700 disabled:opacity-40 transition-all"
          >
            {createCat.isPending ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <><Plus className="h-3.5 w-3.5" /> {t("common.add")}</>}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-8 w-8 text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-400">{t("inventory.noCategories")}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 px-5 py-3.5 group">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color ?? "#94a3b8" }}
                />
                {editId === cat.id ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editName.trim()) updateCat.mutate({ id: cat.id, name: editName.trim() });
                      if (e.key === "Escape") setEditId(null);
                    }}
                    className="flex-1 h-8 px-2 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <span className="flex-1 text-sm font-semibold text-slate-800">{cat.name}</span>
                )}
                <span className="text-xs text-slate-400 tabular-nums mr-2">{t("inventory.productsCount", { count: cat._count.products })}</span>
                {editId === cat.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => editName.trim() && updateCat.mutate({ id: cat.id, name: editName.trim() })}
                      className="h-7 px-2.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                    >{t("common.save")}</button>
                    <button onClick={() => setEditId(null)} className="h-7 px-2.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">{t("common.cancel")}</button>
                  </div>
                ) : (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditId(cat.id); setEditName(cat.name); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (cat._count.products > 0) {
                          toast({ title: t("inventory.cannotDelete"), description: t("inventory.cannotDeleteDesc"), variant: "destructive" });
                          return;
                        }
                        if (confirm(t("inventory.deleteConfirm", { name: cat.name }))) deleteCat.mutate({ id: cat.id });
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InventoryView() {
  const formatCurrency = useFormatCurrency();
  const { t } = useTranslation();
  const [tab, setTab]             = useState<"products" | "categories">("products");
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [lowStock, setLowStock]   = useState(false);
  const [viewMode, setViewMode]   = useState<"grid" | "table">("grid");
  const [page, setPage]           = useState(1);
  const [panel, setPanel]         = useState<PanelState>({ mode: "none" });

  const { data: productsData, isLoading, isFetching } = trpc.products.list.useQuery({
    search:     search || undefined,
    categoryId: catFilter || undefined,
    lowStock:   lowStock || undefined,
    page,
    pageSize:   PAGE_SIZE,
  });
  const { data: categories = [], refetch: refetchCats } = trpc.categories.list.useQuery();

  const products   = productsData?.items ?? [];
  const totalCount = productsData?.total ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleCat    = (v: string)  => { setCatFilter(v); setPage(1); };
  const handleLow    = ()           => { setLowStock((x) => !x); setPage(1); };

  const closePanel = () => setPanel({ mode: "none" });

  const panelOpen = panel.mode !== "none";

  return (
    <div className="flex flex-col h-full min-h-0 gap-5">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t("inventory.title")}</h1>
          <p className="text-sm text-slate-400 mt-0.5">{t("inventory.subtitle")}</p>
        </div>
        {tab === "products" && (
          <button
            onClick={() => setPanel({ mode: "add" })}
            className="flex items-center gap-2 h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-indigo-200 transition-all active:scale-[0.97] shrink-0"
          >
            <Plus className="h-4 w-4" />
            {t("inventory.addProduct")}
          </button>
        )}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit shrink-0">
        {([
          { key: "products",   label: t("inventory.tabProducts"),   Icon: Package    },
          { key: "categories", label: t("inventory.tabCategories"), Icon: FolderOpen },
        ] as const).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 h-8 px-4 rounded-lg text-xs font-bold transition-all",
              tab === key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === "categories" ? (
        <CategoryManager categories={categories} onRefresh={refetchCats} />
      ) : (
        <div className="flex flex-col flex-1 min-h-0 gap-3">

          {/* ── Filters ──────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                placeholder={t("inventory.searchPlaceholder")}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-10 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
              {search && (
                <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex gap-2 shrink-0">
              {/* Category filter */}
              <select
                value={catFilter}
                onChange={(e) => handleCat(e.target.value)}
                className="h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm pr-8"
              >
                <option value="">{t("inventory.allCategories")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Low stock toggle */}
              <button
                onClick={handleLow}
                className={cn(
                  "h-11 px-4 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all",
                  lowStock
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:border-amber-200 hover:text-amber-600"
                )}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {t("inventory.lowStock")}
              </button>

              {/* View toggle */}
              <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn("w-10 h-11 flex items-center justify-center transition-colors", viewMode === "grid" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-700")}
                  aria-label={t("inventory.gridView")}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={cn("w-10 h-11 flex items-center justify-center transition-colors border-l border-slate-200", viewMode === "table" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-700")}
                  aria-label={t("inventory.tableView")}
                >
                  <LayoutList className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Results bar */}
          <div className="flex items-center justify-between shrink-0">
            <p className="text-sm text-slate-500">
              {isLoading ? t("common.loading") : (
                <><span className="font-semibold text-slate-800">{totalCount}</span> {totalCount !== 1 ? t("inventory.productCountPlural") : t("inventory.productCount")}{lowStock && ` · ${t("inventory.lowStockSuffix")}`}</>
              )}
            </p>
            {isFetching && !isLoading && (
              <span className="h-4 w-4 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
            )}
          </div>

          {/* ── Product list ─────────────────────────────────────── */}
          <div className="flex-1 min-h-0 overflow-auto">
            {isLoading ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="h-44 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-4">
                      <div className="h-3 w-40 bg-slate-100 rounded animate-pulse flex-1" />
                      <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
                      <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse" />
                    </div>
                  ))}
                </div>
              )
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mb-4">
                  <Package className="h-7 w-7 text-slate-200" />
                </div>
                <p className="text-sm font-semibold text-slate-400">{t("inventory.noProducts")}</p>
                {(search || catFilter || lowStock) && (
                  <button onClick={() => { handleSearch(""); handleCat(""); setLowStock(false); }} className="text-xs text-indigo-600 mt-2.5 hover:underline font-semibold">
                    {t("inventory.clearFilters")}
                  </button>
                )}
              </div>
            ) : viewMode === "grid" ? (
              /* ─ Grid ─ */
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-4">
                {products.map((product) => {
                  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
                  const isLow      = product.variants.some((v) => v.stock <= v.lowStock);
                  const isOut      = totalStock === 0;
                  const st         = stockStatus(totalStock, product.variants[0]?.lowStock ?? 5);
                  const isSelected = panel.mode === "detail" && panel.productId === product.id;

                  return (
                    <button
                      key={product.id}
                      onClick={() => setPanel({ mode: "detail", productId: product.id })}
                      className={cn(
                        "text-left p-4 rounded-2xl border bg-white transition-all duration-150 active:scale-[0.97] flex flex-col gap-2",
                        isSelected
                          ? "border-indigo-300 shadow-md shadow-indigo-50 ring-2 ring-inset ring-indigo-200"
                          : "border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 cursor-pointer"
                      )}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          isOut ? "bg-red-50" : isLow ? "bg-amber-50" : "bg-slate-50"
                        )}>
                          <Package className={cn("h-4 w-4", isOut ? "text-red-300" : isLow ? "text-amber-400" : "text-slate-300")} />
                        </div>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", st.pill)}>
                          {isOut ? t("inventory.statusOut") : `${totalStock}`}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug">{product.name}</p>
                        {product.category && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{product.category.name}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-sm font-black text-slate-900 tabular-nums">{formatCurrency(product.price)}</span>
                        {product.sku && (
                          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[60px]">{product.sku}</span>
                        )}
                      </div>

                      {isLow && !isOut && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                          {t("inventory.lowStockSuffix")}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* ─ Table ─ */
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {([
                        "inventory.colProduct", "inventory.sku", "inventory.category",
                        "inventory.colPriceCost", "inventory.colStock", "common.status",
                      ] as const).map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          {t(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {products.map((product) => {
                      const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
                      const isLow      = product.variants.some((v) => v.stock <= v.lowStock);
                      const st         = stockStatus(totalStock, product.variants[0]?.lowStock ?? 5);
                      const isSelected = panel.mode === "detail" && panel.productId === product.id;

                      return (
                        <tr
                          key={product.id}
                          onClick={() => setPanel({ mode: "detail", productId: product.id })}
                          className={cn("cursor-pointer transition-colors hover:bg-slate-50/70", isSelected && "bg-indigo-50/60")}
                        >
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-slate-800">{product.name}</p>
                            {product.barcode && <p className="text-[11px] text-slate-400 font-mono">{product.barcode}</p>}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{product.sku ?? "—"}</td>
                          <td className="px-5 py-3.5">
                            {product.category ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: product.category.color ?? "#94a3b8" }} />
                                {product.category.name}
                              </span>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-slate-900 tabular-nums">{formatCurrency(product.price)}</p>
                            <p className="text-xs text-slate-400 tabular-nums">{t("inventory.costLabel", { amount: formatCurrency(product.costPrice) })}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={cn("font-bold tabular-nums", totalStock === 0 ? "text-red-500" : isLow ? "text-amber-600" : "text-slate-900")}>
                              {totalStock}
                            </span>
                            <span className="text-xs text-slate-400 ml-1">{product.variants.length > 1 ? t("inventory.variantsCount", { count: product.variants.length }) : t("inventory.units")}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full", st.pill)}>
                              {t(st.labelKey)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
                <ChevronLeft className="h-3.5 w-3.5" /> {t("orders.previous")}
              </button>
              <span className="text-xs text-slate-500 tabular-nums">
                {t("orders.pageOf", { page, total: totalPages })}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {t("orders.next")} <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Slide-over panel ─────────────────────────────────────── */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div role="presentation" className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closePanel} />
          <div className="relative w-full sm:w-[480px] bg-white shadow-2xl flex flex-col h-full sm:rounded-l-3xl overflow-hidden">
            {panel.mode === "detail" && (
              <ProductDetailPanel
                productId={panel.productId}
                onClose={closePanel}
                onEdit={(id) => setPanel({ mode: "edit", productId: id })}
              />
            )}
            {(panel.mode === "add" || panel.mode === "edit") && (
              <ProductFormPanel
                productId={panel.mode === "edit" ? panel.productId : undefined}
                categories={categories}
                onClose={closePanel}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
