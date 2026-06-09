import { requireAuth } from "@/lib/auth";
import { ExpensesViewClient } from "@/components/finance/expenses/expenses-view-client";

export default async function FinanceExpensesPage() {
  await requireAuth(["ADMIN"]);
  return <ExpensesViewClient />;
}
