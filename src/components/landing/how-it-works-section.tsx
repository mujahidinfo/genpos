const steps = [
  {
    number: "01",
    title: "Set up your shop",
    description:
      "Add your products, categories, and team members in minutes — no training required.",
  },
  {
    number: "02",
    title: "Start selling",
    description:
      "Use the POS to ring up sales, manage orders, and accept any payment method from day one.",
  },
  {
    number: "03",
    title: "Track & grow",
    description:
      "Watch your dashboard update in real time and make decisions backed by real numbers.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-t border-slate-100 bg-slate-50/60 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Up and running in three steps
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-10 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white">
                {step.number}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
