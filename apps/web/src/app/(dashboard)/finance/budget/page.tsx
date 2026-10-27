import { requireAuth } from "@/lib/auth";
import { BudgetViewClient } from "@/components/finance/budget/budget-view-client";

export default async function FinanceBudgetPage() {
  await requireAuth(["ADMIN"]);
  return <BudgetViewClient />;
}
