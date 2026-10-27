"use client";

import dynamic from "next/dynamic";
import type { AuthUser } from "@/lib/auth";

const SettingsViewDynamic = dynamic(
  () => import("./settings-view").then((m) => m.SettingsView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    ),
  },
);

export function SettingsViewClient({ user }: { user: AuthUser }) {
  return <SettingsViewDynamic user={user} />;
}
