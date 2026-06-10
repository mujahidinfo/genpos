import { BarChart3, Package, Receipt, ShoppingCart, Users, Wallet } from "lucide-react";

const features = [
  {
    icon: Receipt,
    title: "Fast, simple checkout",
    description:
      "Ring up sales in seconds and accept cash, card, mobile money, or bank transfer — all from one screen.",
  },
  {
    icon: Package,
    title: "Inventory that updates itself",
    description:
      "Stock levels adjust automatically with every sale, with low-stock alerts before you run out.",
  },
  {
    icon: ShoppingCart,
    title: "Every order, organized",
    description:
      "Track walk-in and online orders from purchase through fulfillment, refund, or cancellation.",
  },
  {
    icon: Users,
    title: "Customers you actually know",
    description:
      "Build a profile and purchase history for every regular — no more guessing who bought what.",
  },
  {
    icon: BarChart3,
    title: "Reports that make sense",
    description:
      "See your best-selling products, busiest hours, and revenue trends without spreadsheets.",
  },
  {
    icon: Wallet,
    title: "Finance, built in",
    description:
      "Track expenses, staff salaries, and budgets, then generate income statements in a click.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            The solution
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            One system for your entire shop
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            GenPOS brings every part of running a shop — selling, stocking, and tracking —
            into a single, easy-to-use dashboard.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-lg hover:shadow-slate-100"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                <feature.icon className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
