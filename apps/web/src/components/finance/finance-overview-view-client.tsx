"use client";
import dynamic from "next/dynamic";

export const FinanceOverviewClient = dynamic(
  () => import("./finance-overview").then((m) => m.FinanceOverview),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    ),
  },
);
