import { requireAuth } from "@/lib/auth";
import { DashboardOverview } from "@/components/dashboard/overview";

export default async function DashboardPage() {
  const user = await requireAuth();
  return <DashboardOverview user={user} />;
}
