import { requireAuth } from "@/lib/auth";
import { EmployeesViewClient } from "@/components/finance/employees/employees-view-client";

export default async function FinanceEmployeesPage() {
  await requireAuth(["ADMIN"]);
  return <EmployeesViewClient />;
}
