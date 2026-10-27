"use client";
import dynamic from "next/dynamic";

export const ExpensesViewClient = dynamic(
  () => import("./expenses-view").then((m) => m.ExpensesView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    ),
  },
);
