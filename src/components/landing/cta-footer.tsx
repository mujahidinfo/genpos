import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white px-6 py-16 text-center sm:px-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Ready to bring order to your shop?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Set up GenPOS today and start selling, tracking, and growing — all from one
            dashboard.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
              <Store className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold leading-none text-slate-900">GenPOS</p>
              <p className="mt-0.5 text-xs text-slate-400">Point of Sale for modern shops</p>
            </div>
          </Link>

          <nav className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#features" className="hover:text-slate-900">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-slate-900">
              How it works
            </a>
            <a href="#faq" className="hover:text-slate-900">
              FAQ
            </a>
            <Link href="/login" className="hover:text-slate-900">
              Sign in
            </Link>
          </nav>
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} GenPOS. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
