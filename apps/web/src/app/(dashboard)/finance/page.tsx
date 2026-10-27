import { requireAuth } from "@/lib/auth";
import { FinanceOverviewClient } from "@/components/finance/finance-overview-view-client";

export default async function FinancePage() {
  await requireAuth(["ADMIN"]);
  return <FinanceOverviewClient />;
}
