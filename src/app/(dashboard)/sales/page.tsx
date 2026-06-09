import { requireAuth } from "@/lib/auth";
import { SalesViewClient } from "@/components/sales/sales-view-client";

export default async function SalesPage() {
  await requireAuth(["ADMIN", "CASHIER"]);
  return <SalesViewClient />;
}
