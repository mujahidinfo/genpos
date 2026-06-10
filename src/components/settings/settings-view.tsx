"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { getCurrencySymbol, useCurrency } from "@/lib/currency-context";
import { useTranslation, type TranslationKey } from "@/lib/i18n/language-context";
import { LANGUAGES, type Language } from "@/lib/i18n/translations";
import {
  Store, Mail, Phone, MapPin, Percent, Receipt, Users,
  KeyRound, Eye, EyeOff, Plus, Pencil, Check, X, Shield,
  ChevronDown, Globe, CircleDollarSign, UserCog, Lock,
  CheckCircle2, UserPlus, ToggleLeft, ToggleRight, Languages,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AuthUser } from "@/lib/auth";

// ─── Currency list ─────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "INR", name: "Indian Rupee" },
  { code: "BDT", name: "Bangladeshi Taka" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "AED", name: "UAE Dirham" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "PKR", name: "Pakistani Rupee" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "ZAR", name: "South African Rand" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "THB", name: "Thai Baht" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "KRW", name: "South Korean Won" },
];

// ─── Role config ───────────────────────────────────────────────────────────────

const ROLES = ["ADMIN", "CASHIER", "INVENTORY_MANAGER"] as const;
type Role = (typeof ROLES)[number];

const ROLE_CONFIG: Record<Role, { labelKey: TranslationKey; color: string; descKey: TranslationKey }> = {
  ADMIN:             { labelKey: "roles.ADMIN",             color: "bg-violet-50 text-violet-700 border-violet-200",   descKey: "roles.adminDesc" },
  CASHIER:           { labelKey: "roles.CASHIER",           color: "bg-blue-50 text-blue-700 border-blue-200",         descKey: "roles.cashierDesc" },
  INVENTORY_MANAGER: { labelKey: "roles.INVENTORY_MANAGER", color: "bg-emerald-50 text-emerald-700 border-emerald-200", descKey: "roles.inventoryDesc" },
};

// ─── Tab type ─────────────────────────────────────────────────────────────────

type SettingsTab = "shop" | "currency" | "language" | "team" | "account";

const TABS: { key: SettingsTab; labelKey: TranslationKey; Icon: React.ElementType }[] = [
  { key: "shop",     labelKey: "settings.tabShop",     Icon: Store            },
  { key: "currency", labelKey: "settings.tabCurrency", Icon: CircleDollarSign },
  { key: "language", labelKey: "settings.tabLanguage", Icon: Languages        },
  { key: "team",     labelKey: "settings.tabTeam",     Icon: Users            },
  { key: "account",  labelKey: "settings.tabAccount",  Icon: Lock             },
];

// ─── Field component ──────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function TextInput({ value, onChange, type = "text", placeholder, className }: {
  value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; className?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors",
        className
      )}
    />
  );
}

// ─── Shop Settings Tab ────────────────────────────────────────────────────────

function ShopTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data: shop } = trpc.shop.get.useQuery();

  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });

  useEffect(() => {
    if (shop) setForm({ name: shop.name, email: shop.email ?? "", phone: shop.phone ?? "", address: shop.address ?? "" });
  }, [shop]);

  const updateShop = trpc.shop.update.useMutation({
    onSuccess: () => {
      utils.shop.get.invalidate();
      toast({ title: t("settings.shopProfileSaved") });
    },
    onError: (e) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const handleSave = () => {
    if (!form.name.trim()) { toast({ title: t("settings.shopNameRequired"), variant: "destructive" }); return; }
    updateShop.mutate({
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      currency: shop?.currency ?? "USD",
      language: shop?.language ?? "en",
      taxRate: shop?.taxRate ?? 0,
      taxName: shop?.taxName ?? "Tax",
    });
  };

  const set = (key: keyof typeof form) => (v: string) => setForm((p) => ({ ...p, [key]: v }));

  return (
    <div className="space-y-5">
      <SectionCard
        icon={<Store className="h-4 w-4 text-slate-500" />}
        title={t("settings.shopProfile")}
        desc={t("settings.shopProfileDesc")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={`${t("settings.shopName")} *`}>
            <TextInput value={form.name} onChange={set("name")} placeholder="My Awesome Store" />
          </Field>
          <Field label={t("settings.emailAddress")}>
            <TextInput type="email" value={form.email} onChange={set("email")} placeholder="shop@example.com" />
          </Field>
          <Field label={t("settings.phoneNumber")}>
            <TextInput value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" />
          </Field>
        </div>
        <Field label={t("common.address")}>
          <textarea
            rows={2}
            placeholder="123 Main St, City, Country"
            value={form.address}
            onChange={(e) => set("address")(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </Field>
        <SaveButton onClick={handleSave} isPending={updateShop.isPending} label={t("common.saveChanges")} />
      </SectionCard>
    </div>
  );
}

// ─── Currency & Tax Tab ───────────────────────────────────────────────────────

function CurrencyTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data: shop } = trpc.shop.get.useQuery();
  const activeCurrency = useCurrency();

  const [selectedCurrency, setSelectedCurrency] = useState(shop?.currency ?? "USD");
  const [taxName, setTaxName] = useState(shop?.taxName ?? "Tax");
  const [taxRate, setTaxRate] = useState(shop?.taxRate?.toString() ?? "0");
  const [currencySearch, setCurrencySearch] = useState("");

  useEffect(() => {
    if (shop) {
      setSelectedCurrency(shop.currency);
      setTaxName(shop.taxName);
      setTaxRate(shop.taxRate.toString());
    }
  }, [shop]);

  const updateShop = trpc.shop.update.useMutation({
    onSuccess: () => {
      utils.shop.get.invalidate();
      toast({ title: t("settings.currencySaved"), description: t("settings.currencySavedDesc") });
    },
    onError: (e) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const handleSave = () => {
    updateShop.mutate({
      name: shop?.name ?? "My Shop",
      email: shop?.email ?? undefined,
      phone: shop?.phone ?? undefined,
      address: shop?.address ?? undefined,
      currency: selectedCurrency,
      language: shop?.language ?? "en",
      taxRate: parseFloat(taxRate) || 0,
      taxName: taxName || "Tax",
    });
  };

  const filteredCurrencies = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.name.toLowerCase().includes(currencySearch.toLowerCase())
  );

  const previewSymbol = getCurrencySymbol(selectedCurrency);

  return (
    <div className="space-y-5">
      {/* Active currency banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
          <span className="text-sm font-black text-indigo-700">{getCurrencySymbol(activeCurrency)}</span>
        </div>
        <div>
          <p className="text-sm font-bold text-indigo-900">{t("settings.activeCurrency", { currency: activeCurrency })}</p>
          <p className="text-xs text-indigo-600">{t("settings.activeCurrencyDesc")}</p>
        </div>
      </div>

      <SectionCard
        icon={<Globe className="h-4 w-4 text-slate-500" />}
        title={t("settings.currency")}
        desc={t("settings.currencyDesc")}
      >
        {/* Search */}
        <div className="relative mb-3">
          <input
            type="search"
            placeholder={t("settings.searchCurrencies")}
            value={currencySearch}
            onChange={(e) => setCurrencySearch(e.target.value)}
            className="w-full h-10 pl-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {currencySearch && (
            <button onClick={() => setCurrencySearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-700">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Currency grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto [scrollbar-width:none] pr-0.5">
          {filteredCurrencies.map((c) => {
            const sym = getCurrencySymbol(c.code);
            const isSelected = selectedCurrency === c.code;
            return (
              <button
                key={c.code}
                onClick={() => setSelectedCurrency(c.code)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-[0.97]",
                  isSelected
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                )}
              >
                <span className={cn("text-base font-black w-6 shrink-0 text-center", isSelected ? "text-white" : "text-slate-900")}>
                  {sym}
                </span>
                <div className="min-w-0">
                  <p className={cn("text-xs font-bold truncate", isSelected ? "text-white" : "text-slate-800")}>{c.code}</p>
                  <p className={cn("text-[10px] truncate", isSelected ? "text-indigo-200" : "text-slate-400")}>{c.name}</p>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 ml-auto shrink-0 text-white" />}
              </button>
            );
          })}
          {filteredCurrencies.length === 0 && (
            <div className="col-span-3 py-8 text-center text-sm text-slate-400">{t("settings.noCurrencyMatch", { query: currencySearch })}</div>
          )}
        </div>

        {/* Preview */}
        <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500">{t("settings.preview")}</p>
          <p className="text-sm font-black text-slate-900">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: selectedCurrency, minimumFractionDigits: 2 }).format(1234.56)}
          </p>
          <span className="text-xs text-slate-400 ml-auto">{selectedCurrency}</span>
        </div>
      </SectionCard>

      <SectionCard
        icon={<Percent className="h-4 w-4 text-slate-500" />}
        title={t("settings.taxSettings")}
        desc={t("settings.taxSettingsDesc")}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("settings.taxName")}>
            <TextInput value={taxName} onChange={setTaxName} placeholder="Tax / VAT / GST" />
          </Field>
          <Field label={t("settings.taxRate")}>
            <div className="relative">
              <TextInput
                type="number"
                value={taxRate}
                onChange={setTaxRate}
                placeholder="0"
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
            </div>
          </Field>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500">{t("settings.onSale")}</p>
          <p className="text-sm font-bold text-slate-900">
            {taxName || t("common.tax")}: {previewSymbol}{(100 * (parseFloat(taxRate) || 0) / 100).toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 ml-auto">
            {t("common.total")}: {previewSymbol}{(100 + 100 * (parseFloat(taxRate) || 0) / 100).toFixed(2)}
          </p>
        </div>
        <SaveButton onClick={handleSave} isPending={updateShop.isPending} label={t("settings.saveCurrencyTax")} />
      </SectionCard>
    </div>
  );
}

// ─── Language Tab ─────────────────────────────────────────────────────────────

function LanguageTab() {
  const { t, language: activeLanguage } = useTranslation();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data: shop } = trpc.shop.get.useQuery();

  const activeMeta = LANGUAGES.find((l) => l.code === activeLanguage) ?? LANGUAGES[0];

  const setLanguage = trpc.shop.setLanguage.useMutation({
    onSuccess: (updated) => {
      utils.shop.get.invalidate();
      const meta = LANGUAGES.find((l) => l.code === updated.language) ?? LANGUAGES[0];
      toast({
        title: t("settings.languageSaved"),
        description: t("settings.languageSavedDesc", { language: meta.nativeLabel }),
      });
    },
    onError: (e) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const handleSelect = (code: Language) => {
    if (code === shop?.language || setLanguage.isPending) return;
    setLanguage.mutate({ language: code });
  };

  return (
    <div className="space-y-5">
      {/* Active language banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
          <Languages className="h-4 w-4 text-indigo-700" />
        </div>
        <div>
          <p className="text-sm font-bold text-indigo-900">
            {t("settings.activeLanguage", { language: activeMeta.nativeLabel })}
          </p>
          <p className="text-xs text-indigo-600">{t("settings.activeLanguageDesc")}</p>
        </div>
      </div>

      <SectionCard
        icon={<Globe className="h-4 w-4 text-slate-500" />}
        title={t("settings.language")}
        desc={t("settings.languageDesc")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LANGUAGES.map((lang) => {
            const isSelected = (shop?.language ?? "en") === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                disabled={setLanguage.isPending}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all active:scale-[0.98] disabled:opacity-60",
                  isSelected
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50",
                )}
              >
                <span className={cn("text-lg font-black w-9 shrink-0 text-center", isSelected ? "text-white" : "text-slate-900")}>
                  {lang.code.toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-bold truncate", isSelected ? "text-white" : "text-slate-800")}>{lang.nativeLabel}</p>
                  <p className={cn("text-xs truncate", isSelected ? "text-indigo-200" : "text-slate-400")}>{lang.label}</p>
                </div>
                {isSelected && <Check className="h-4 w-4 ml-auto shrink-0 text-white" />}
              </button>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Team Tab ─────────────────────────────────────────────────────────────────

function TeamTab({ currentUser }: { currentUser: AuthUser }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data: users = [] } = trpc.users.list.useQuery();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "CASHIER" as Role });
  const [showPassword, setShowPassword] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role>("CASHIER");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createUser = trpc.users.create.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      setNewUser({ name: "", email: "", password: "", role: "CASHIER" });
      setShowAddForm(false);
      toast({ title: t("settings.userCreated") });
    },
    onError: (e) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const updateUser = trpc.users.update.useMutation({
    onSuccess: () => { utils.users.list.invalidate(); setEditingUserId(null); toast({ title: t("settings.userUpdated") }); },
    onError: (e) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const toggleActive = (id: string, current: boolean, name: string) => {
    if (id === currentUser.id) { toast({ title: t("settings.cannotDeactivateSelf"), variant: "destructive" }); return; }
    updateUser.mutate({ id, isActive: !current });
  };

  const handleAddUser = () => {
    const errs: Record<string, string> = {};
    if (!newUser.name.trim())             errs.name     = t("settings.nameRequired");
    if (!newUser.email.trim())            errs.email    = t("settings.emailRequired");
    if (!newUser.password || newUser.password.length < 6) errs.password = t("settings.minChars");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    createUser.mutate(newUser);
  };

  return (
    <div className="space-y-5">
      {/* Add user form */}
      {showAddForm && (
        <SectionCard
          icon={<UserPlus className="h-4 w-4 text-indigo-500" />}
          title={t("settings.addTeamMember")}
          desc={t("settings.addTeamMemberDesc")}
          accent
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={`${t("settings.fullName")} *`} error={errors.name}>
              <TextInput value={newUser.name} onChange={(v) => setNewUser((p) => ({ ...p, name: v }))} placeholder="Jane Doe" />
            </Field>
            <Field label={`${t("settings.emailAddress")} *`} error={errors.email}>
              <TextInput type="email" value={newUser.email} onChange={(v) => setNewUser((p) => ({ ...p, email: v }))} placeholder="jane@store.com" />
            </Field>
            <Field label={`${t("settings.password")} *`} error={errors.password}>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("settings.minChars")}
                  value={newUser.password}
                  onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                  className="w-full h-11 pl-3 pr-10 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field label={t("settings.role")}>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value as Role }))}
                className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{t(ROLE_CONFIG[r].labelKey)} — {t(ROLE_CONFIG[r].descKey)}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowAddForm(false); setErrors({}); }}
              className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleAddUser}
              disabled={createUser.isPending}
              className="flex-[2] h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {createUser.isPending
                ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <><UserPlus className="h-4 w-4" /> {t("settings.createAccount")}</>
              }
            </button>
          </div>
        </SectionCard>
      )}

      <SectionCard
        icon={<Users className="h-4 w-4 text-slate-500" />}
        title={t("settings.teamMembers")}
        desc={users.length === 1
          ? t("settings.memberCount", { count: users.length })
          : t("settings.memberCountPlural", { count: users.length })}
        action={
          !showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 h-8 px-3 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> {t("settings.addMember")}
            </button>
          ) : undefined
        }
      >
        {users.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">{t("settings.noTeamMembers")}</div>
        ) : (
          <div className="divide-y divide-slate-50 -mx-5 -mb-5">
            {users.map((u) => {
              const role = u.role as Role;
              const cfg = ROLE_CONFIG[role];
              const isEditing = editingUserId === u.id;
              const isSelf = u.id === currentUser.id;

              return (
                <div key={u.id} className={cn("flex items-center gap-3 px-5 py-3.5 group transition-colors", !u.isActive && "opacity-50")}>
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 font-bold text-sm text-slate-600">
                    {u.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800 truncate">{u.name}</p>
                      {isSelf && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{t("settings.you")}</span>}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>

                  {/* Role */}
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as Role)}
                        className="h-8 px-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{t(ROLE_CONFIG[r].labelKey)}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => updateUser.mutate({ id: u.id, role: editRole })}
                        className="w-7 h-7 flex items-center justify-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setEditingUserId(null)}
                        className="w-7 h-7 flex items-center justify-center bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 cursor-pointer hover:opacity-80 transition-opacity", cfg.color)}
                      onClick={() => { if (!isSelf) { setEditingUserId(u.id); setEditRole(role); } }}
                      title={isSelf ? t("settings.cannotChangeOwnRole") : t("settings.clickToChangeRole")}
                    >
                      {t(cfg.labelKey)}
                    </span>
                  )}

                  {/* Active toggle */}
                  <button
                    onClick={() => toggleActive(u.id, u.isActive, u.name)}
                    disabled={isSelf}
                    className={cn(
                      "shrink-0 transition-colors",
                      isSelf ? "opacity-30 cursor-not-allowed" : "hover:opacity-75"
                    )}
                    title={u.isActive ? t("settings.deactivateUser") : t("settings.activateUser")}
                  >
                    {u.isActive
                      ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                      : <ToggleLeft  className="h-5 w-5 text-slate-300" />
                    }
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Account Tab ──────────────────────────────────────────────────────────────

function AccountTab({ user }: { user: AuthUser }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext]       = useState(false);

  const changePassword = trpc.users.changePassword.useMutation({
    onSuccess: () => {
      setForm({ current: "", next: "", confirm: "" });
      toast({ title: t("settings.passwordChanged") });
    },
    onError: (e) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const handleChange = () => {
    if (form.next.length < 6) { toast({ title: t("settings.passwordMin6"), variant: "destructive" }); return; }
    if (form.next !== form.confirm) { toast({ title: t("settings.passwordsDontMatch"), variant: "destructive" }); return; }
    changePassword.mutate({ currentPassword: form.current, newPassword: form.next });
  };

  const strength = (() => {
    const p = form.next;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8)          s++;
    if (/[A-Z]/.test(p))        s++;
    if (/[0-9]/.test(p))        s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ["", t("settings.strengthWeak"), t("settings.strengthFair"), t("settings.strengthGood"), t("settings.strengthStrong")][strength];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-emerald-500"][strength];

  const PasswordInput = ({ label, value, onChange, show, onToggle }: {
    label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void;
  }) => (
    <Field label={label}>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 pl-3 pr-10 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </Field>
  );

  return (
    <div className="space-y-5">
      {/* Identity card */}
      <SectionCard
        icon={<UserCog className="h-4 w-4 text-slate-500" />}
        title={t("settings.myAccount")}
        desc={t("settings.myAccountDesc")}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-xl font-black text-indigo-700">{user.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <span className={cn("inline-block mt-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border", ROLE_CONFIG[user.role as Role]?.color ?? "bg-slate-100 text-slate-600")}>
              {ROLE_CONFIG[user.role as Role] ? t(ROLE_CONFIG[user.role as Role].labelKey) : user.role}
            </span>
          </div>
        </div>
      </SectionCard>

      {/* Change password */}
      <SectionCard
        icon={<KeyRound className="h-4 w-4 text-slate-500" />}
        title={t("settings.changePassword")}
        desc={t("settings.changePasswordDesc")}
      >
        <PasswordInput
          label={t("settings.currentPassword")}
          value={form.current}
          onChange={(v) => setForm((p) => ({ ...p, current: v }))}
          show={showCurrent}
          onToggle={() => setShowCurrent((x) => !x)}
        />
        <div className="h-px" />
        <PasswordInput
          label={t("settings.newPassword")}
          value={form.next}
          onChange={(v) => setForm((p) => ({ ...p, next: v }))}
          show={showNext}
          onToggle={() => setShowNext((x) => !x)}
        />

        {/* Strength bar */}
        {form.next && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={cn("flex-1 h-1.5 rounded-full transition-all", i <= strength ? strengthColor : "bg-slate-100")} />
              ))}
            </div>
            <p className={cn("text-[11px] font-bold", strength <= 1 ? "text-red-500" : strength === 2 ? "text-amber-500" : strength === 3 ? "text-blue-500" : "text-emerald-500")}>
              {strengthLabel}
            </p>
          </div>
        )}

        <PasswordInput
          label={t("settings.confirmNewPassword")}
          value={form.confirm}
          onChange={(v) => setForm((p) => ({ ...p, confirm: v }))}
          show={showNext}
          onToggle={() => setShowNext((x) => !x)}
        />

        {form.confirm && form.next && (
          <div className={cn("flex items-center gap-2 text-xs font-semibold", form.next === form.confirm ? "text-emerald-600" : "text-red-500")}>
            {form.next === form.confirm
              ? <><CheckCircle2 className="h-3.5 w-3.5" /> {t("settings.passwordsMatch")}</>
              : <><X className="h-3.5 w-3.5" /> {t("settings.passwordsDontMatch")}</>
            }
          </div>
        )}

        <button
          onClick={handleChange}
          disabled={!form.current || !form.next || !form.confirm || changePassword.isPending}
          className="w-full h-12 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {changePassword.isPending
            ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            : <><KeyRound className="h-4 w-4" /> {t("settings.updatePassword")}</>
          }
        </button>
      </SectionCard>
    </div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionCard({ icon, title, desc, children, action, accent }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={cn(
      "bg-white rounded-2xl border shadow-sm p-5 space-y-5",
      accent ? "border-indigo-100 shadow-indigo-50" : "border-slate-100"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">{title}</p>
            <p className="text-xs text-slate-400">{desc}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function SaveButton({ onClick, isPending, label = "Save Changes" }: {
  onClick: () => void;
  isPending: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isPending}
      className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
    >
      {isPending
        ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        : <><CheckCircle2 className="h-4 w-4" /> {label}</>
      }
    </button>
  );
}

// ─── Main Settings View ───────────────────────────────────────────────────────

export function SettingsView({ user }: { user: AuthUser }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<SettingsTab>("shop");

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t("settings.title")}</h1>
        <p className="text-sm text-slate-400 mt-0.5">{t("settings.subtitle")}</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit overflow-x-auto [scrollbar-width:none]">
        {TABS.map(({ key, labelKey, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
              tab === key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === "shop"     && <ShopTab />}
        {tab === "currency" && <CurrencyTab />}
        {tab === "language" && <LanguageTab />}
        {tab === "team"     && <TeamTab currentUser={user} />}
        {tab === "account"  && <AccountTab user={user} />}
      </div>
    </div>
  );
}
