"use client";

import dynamic from "next/dynamic";

export const SalesViewClient = dynamic(
  () => import("./sales-view"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    ),
  },
);
