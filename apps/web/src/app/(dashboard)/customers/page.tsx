import { requireAuth } from "@/lib/auth";
import { CustomersViewClient } from "@/components/customers/customers-view-client";

export default async function CustomersPage() {
  await requireAuth();
  return <CustomersViewClient />;
}
