import { Calculator, EyeOff, NotebookPen, PackageSearch } from "lucide-react";

const problems = [
  {
    icon: NotebookPen,
    title: "Sales scattered everywhere",
    description: "Paper receipts, messaging apps, and spreadsheets that never quite add up.",
  },
  {
    icon: PackageSearch,
    title: "Stock surprises",
    description: "You find out a best-seller is out of stock only after a customer asks for it.",
  },
  {
    icon: Calculator,
    title: "Manual math on every sale",
    description: "Tax, discounts, and change calculated by hand — and sometimes wrong.",
  },
  {
    icon: EyeOff,
    title: "No real picture of profit",
    description: "Busy every day, with no clear answer to whether you’re actually making money.",
  },
];

export function ProblemSection() {
  return (
    <section className="border-t border-slate-100 bg-slate-50/60 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            The problem
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Sound familiar?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Most small shops are stuck stitching together notebooks, spreadsheets, and
            guesswork — and it’s costing you sales, time, and peace of mind.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                <problem.icon className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{problem.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{problem.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
