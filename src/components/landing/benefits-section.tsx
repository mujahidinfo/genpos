import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const benefits = [
  "Real-time inventory across every product and variant",
  "Role-based access for admins, cashiers, and inventory managers",
  "Built-in finance tracking — expenses, salaries, and budgets",
  "Support for cash, card, mobile money, and bank transfers",
  "A clean interface your team can learn in minutes, not days",
];

const stockItems = [
  { name: "Wireless Earbuds", sku: "SKU-1042", stock: 86, status: "In Stock" },
  { name: "Cotton T-Shirt (M)", sku: "SKU-2031", stock: 4, status: "Low Stock" },
  { name: "Ceramic Mug Set", sku: "SKU-3157", stock: 0, status: "Out of Stock" },
  { name: "Leather Wallet", sku: "SKU-4490", stock: 32, status: "In Stock" },
];

const statusStyles: Record<string, string> = {
  "In Stock": "bg-green-50 text-green-700",
  "Low Stock": "bg-amber-50 text-amber-700",
  "Out of Stock": "bg-red-50 text-red-700",
};

export function BenefitsSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Built for your whole team
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Give every role the access it needs — nothing more, nothing less
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              From the owner to the newest cashier, everyone gets a dashboard built for their
              job.
            </p>
            <ul className="mt-8 space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                  <span className="text-slate-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <p className="text-sm font-semibold text-slate-900">Inventory</p>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                2 need attention
              </span>
            </div>
            <ul className="divide-y divide-slate-100">
              {stockItems.map((item) => (
                <li key={item.sku} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{item.stock} units</p>
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                        statusStyles[item.status],
                      )}
                    >
                      {item.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
