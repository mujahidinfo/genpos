"use client";

import dynamic from "next/dynamic";

export const InventoryViewClient = dynamic(
  () => import("./inventory-view").then((m) => m.InventoryView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    ),
  },
);
