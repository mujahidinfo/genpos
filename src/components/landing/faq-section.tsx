"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Do I need any technical experience to use GenPOS?",
    answer:
      "No. GenPOS is designed to be intuitive from day one — if your team can use a smartphone, they can use GenPOS.",
  },
  {
    question: "Can my whole team use it at the same time?",
    answer:
      "Yes. GenPOS supports role-based accounts for admins, cashiers, and inventory managers, so everyone sees exactly what they need and nothing they don’t.",
  },
  {
    question: "Does GenPOS handle both in-store and online orders?",
    answer:
      "Yes. Every order — walk-in or online — is tracked in one place, from purchase through fulfillment, cancellation, or refund.",
  },
  {
    question: "Can I track more than just sales?",
    answer:
      "Absolutely. GenPOS includes finance tools for expenses, employee salaries, and budgets, plus reports like income statements and expense breakdowns.",
  },
  {
    question: "What payment methods are supported?",
    answer: "Cash, card, mobile money, and bank transfer are all supported out of the box.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-slate-100 bg-slate-50/60 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, index) => {
            const open = openIndex === index;
            return (
              <div key={faq.question} className="rounded-2xl border border-slate-200 bg-white">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                  onClick={() => setOpenIndex(open ? null : index)}
                  aria-expanded={open}
                >
                  <span className="font-medium text-slate-900">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </button>
                {open && (
                  <div className="px-6 pb-4">
                    <p className="text-sm leading-relaxed text-slate-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
