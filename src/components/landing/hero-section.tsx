import Link from "next/link";
import { ArrowRight, AlertTriangle, Receipt, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const weekData = [
  { day: "Mon", value: 45 },
  { day: "Tue", value: 60 },
  { day: "Wed", value: 38 },
  { day: "Thu", value: 75 },
  { day: "Fri", value: 90 },
  { day: "Sat", value: 100 },
  { day: "Sun", value: 65 },
];

const recentSales = [
  { name: "Wireless Earbuds", amount: "$59.00", time: "2 min ago" },
  { name: "Cotton T-Shirt (M)", amount: "$18.50", time: "9 min ago" },
  { name: "Ceramic Mug Set", amount: "$24.00", time: "16 min ago" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-indigo-100/70 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-32 h-80 w-80 rounded-full bg-sky-50 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            All-in-one Point of Sale
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Run your shop with clarity, <span className="text-indigo-600">not chaos.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            GenPOS brings sales, inventory, customers, and finance into one clean dashboard —
            so you always know what’s selling, what’s running low, and what you’re really
            earning.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline">
                See how it works
              </Button>
            </a>
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/60 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Today’s Overview</p>
                <p className="text-xs text-slate-400">Tuesday, Jun 9</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Live
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600" /> Today’s Sales
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">$1,284.50</p>
                <p className="text-xs text-green-600">+12.4% vs yesterday</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Receipt className="h-3.5 w-3.5 text-indigo-600" /> Orders Today
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">42</p>
                <p className="text-xs text-slate-400">8 pending fulfillment</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Low Stock
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">3 items</p>
                <p className="text-xs text-slate-400">Reorder suggested</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 pt-2 sm:grid-cols-5">
              <div className="sm:col-span-3">
                <p className="mb-3 text-xs font-medium text-slate-500">Sales this week</p>
                <div className="flex h-32 items-end justify-between gap-2">
                  {weekData.map((d) => (
                    <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className={cn(
                          "w-full rounded-md",
                          d.day === "Sat" ? "bg-indigo-600" : "bg-indigo-100",
                        )}
                        style={{ height: `${d.value}%` }}
                      />
                      <span className="text-[10px] font-medium text-slate-400">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <p className="mb-3 text-xs font-medium text-slate-500">Recent sales</p>
                <ul className="space-y-2.5">
                  {recentSales.map((sale) => (
                    <li
                      key={sale.name}
                      className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
                          <Receipt className="h-3.5 w-3.5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-900">{sale.name}</p>
                          <p className="text-[10px] text-slate-400">{sale.time}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-slate-900">{sale.amount}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
