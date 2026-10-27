import { requireAuth } from "@/lib/auth";
import { AnalyticsViewClient } from "@/components/analytics/analytics-view-client";

export default async function AnalyticsPage() {
  await requireAuth(["ADMIN"]);
  return <AnalyticsViewClient />;
}
