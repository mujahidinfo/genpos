"use client";

import dynamic from "next/dynamic";

export const AnalyticsViewClient = dynamic(
  () => import("./analytics-view").then((m) => m.AnalyticsView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    ),
  },
);
