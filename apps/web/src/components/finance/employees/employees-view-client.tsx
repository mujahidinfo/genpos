"use client";
import dynamic from "next/dynamic";

export const EmployeesViewClient = dynamic(
  () => import("./employees-view").then((m) => m.EmployeesView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    ),
  },
);
