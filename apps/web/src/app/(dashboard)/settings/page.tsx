import { requireAuth } from "@/lib/auth";
import { SettingsViewClient } from "@/components/settings/settings-view-client";

export default async function SettingsPage() {
  const user = await requireAuth(["ADMIN"]);
  return <SettingsViewClient user={user} />;
}
