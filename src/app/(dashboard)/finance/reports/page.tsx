import { requireAuth } from "@/lib/auth";
import { ReportsViewClient } from "@/components/finance/reports/reports-view-client";

export default async function FinanceReportsPage() {
  await requireAuth(["ADMIN"]);
  return <ReportsViewClient />;
}
